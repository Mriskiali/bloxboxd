import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useTransition } from 'react';
import { Game, GameLog, safeImgSrc } from './types';
import { GENRE_CATEGORIES, isGameInGenreCategory } from './utils/genre';
import { 
  AppProvider, 
  useApp,
  deduplicateGames
} from './context/AppContext';
import { Navbar } from './components/Navbar';
import { GameCard } from './components/GameCard';
import { GameGridSkeleton } from './components/GameCardSkeleton';
import { ScrollToTop } from './components/ScrollToTop';
import { BloxboxdLogo } from './components/BloxboxdLogo';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/ToastContainer';

// Code-Splitting (Pilar 1): Lazy-load non-critical views and modals to reduce initial JS bundle size
const GameDetailView = lazy(() => import('./components/GameDetailView').then(m => ({ default: m.GameDetailView })));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const DiaryView = lazy(() => import('./components/DiaryView').then(m => ({ default: m.DiaryView })));
const ListsView = lazy(() => import('./components/ListsView').then(m => ({ default: m.ListsView })));
const CommunityView = lazy(() => import('./components/CommunityView').then(m => ({ default: m.CommunityView })));
const LogModal = lazy(() => import('./components/LogModal').then(m => ({ default: m.LogModal })));
const RobloxUrlModal = lazy(() => import('./components/RobloxUrlModal').then(m => ({ default: m.RobloxUrlModal })));
const EditProfileModal = lazy(() => import('./components/EditProfileModal').then(m => ({ default: m.EditProfileModal })));
const RobloxLoginModal = lazy(() => import('./components/RobloxLoginModal').then(m => ({ default: m.RobloxLoginModal })));
const SurpriseMeModal = lazy(() => import('./components/SurpriseMeModal').then(m => ({ default: m.SurpriseMeModal })));

const ViewLoader: React.FC<{ text?: string }> = ({ text = 'Memuat tampilan...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] w-full py-20">
    <div className="w-10 h-10 rounded-full border-3 border-green border-t-transparent animate-spin mb-3" />
    <span className="text-xs font-semibold text-muted">{text}</span>
  </div>
);
import { 
  Flame, 
  TrendingUp, 
  Star, 
  SlidersHorizontal, 
  Sparkles, 
  Compass, 
  Gamepad2, 
  PlusCircle, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Heart,
  Search,
  Loader2,
  CheckCircle2,
  Globe2,
  RotateCcw,
  Play,
  Pause,
  Dices,
  X
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    games, 
    activeTab, 
    setActiveTab, 
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isRealtimeSyncing,
    lastSyncTimestamp,
    refreshRealtimeStats,
    setUrlImportModalOpen, 
    viewGame,
    addGameToCatalog,
    addGamesToCatalog,
    userLogs,
    language,
    t
  } = useApp();

  const userLogMap = useMemo(() => {
    const map = new Map<string, GameLog>();
    userLogs.forEach(log => map.set(log.gameId, log));
    return map;
  }, [userLogs]);

  // Concurrent React 19 transition for non-blocking UI interactions (INP Optimization)
  const [, startTransition] = useTransition();

  // Progressive rendering & infinite scroll states
  const INITIAL_VISIBLE_COUNT = 15;
  const BATCH_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMoreLive, setHasMoreLive] = useState(true);
  const [isFetchingLiveBatch, setIsFetchingLiveBatch] = useState(false);
  const [initialGenreLoading, setInitialGenreLoading] = useState(false);
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastDiscoverAttemptRef = useRef(0);

  // Ensure unique games list to prevent duplicate keys across render cycles
  const uniqueGames = useMemo(() => deduplicateGames(games), [games]);

  // Display and search games for the catalog (filters removed, showing all experiences directly)
  const filteredGames = uniqueGames.filter(g => {
    // Check search query match across name, creator, genre, tags, and placeId
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesName = g.name.toLowerCase().includes(q);
    const matchesCreator = g.creatorName?.toLowerCase().includes(q);
    const matchesGenreText = g.genre?.toLowerCase().includes(q) || g.subgenre?.toLowerCase().includes(q);
    const matchesTags = Array.isArray(g.tags) && g.tags.some(t => t.toLowerCase().includes(q));
    const matchesPlace = g.rootPlaceId?.toString().includes(q) || g.universeId?.toString().includes(q);

    return matchesName || matchesCreator || matchesGenreText || matchesTags || matchesPlace;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'popular') return (b.playerCount || 0) - (a.playerCount || 0);
    if (sortBy === 'rating') return (b.ratingAverage || 0) - (a.ratingAverage || 0);
    if (sortBy === 'visits') return (b.rawVisits || 0) - (a.rawVisits || 0);
    if (sortBy === 'newest') return (b.releaseYear || 0) - (a.releaseYear || 0);
    if (sortBy === 'az') return a.name.localeCompare(b.name);
    return (b.playerCount || 0) - (a.playerCount || 0);
  });

  // Auto-fetch fresh live Roblox games on startup if catalog has few games
  useEffect(() => {
    if (!searchQuery.trim() && uniqueGames.length < 20) {
      fetchNextDiscoverBatch('All', undefined, uniqueGames.length === 0);
    }
  }, []);

  // Reset pagination on search query or sort changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setOnlineSearchError(null);
  }, [searchQuery, sortBy]);

  // Search live Roblox online across all Roblox games by name/ID/link
  const handleSearchRobloxLive = async (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!q) return;

    setIsSearchingOnline(true);
    setOnlineSearchError(null);

    try {
      const res = await fetch(`/api/roblox/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          addGamesToCatalog(data.results);
          setVisibleCount(prev => Math.max(prev, data.results.length));
        } else {
          setOnlineSearchError(t('search_no_results', { query: q }));
        }
      } else {
        setOnlineSearchError(t('search_server_error'));
      }
    } catch (err) {
      setOnlineSearchError('Terjadi gangguan jaringan saat mencari.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Debounced auto-search: automatically queries official Roblox Omni-Search as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) return;

    const timer = setTimeout(() => {
      handleSearchRobloxLive(q);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load next batch of live discover games from Roblox Explore / Omni-Search with cursor
  const fetchNextDiscoverBatch = async (customGenre?: string, customToken?: string, isInitial: boolean = false) => {
    if (isFetchingLiveBatch) return;

    // Rate-limit & throttling protection: minimal 2.5 detik jeda antar panggilan discover
    const now = Date.now();
    if (!isInitial && (now - lastDiscoverAttemptRef.current) < 2500) {
      return;
    }
    lastDiscoverAttemptRef.current = now;

    const targetGenre = customGenre !== undefined ? customGenre : 'All';
    const targetToken = customToken !== undefined ? customToken : nextPageToken;

    setIsFetchingLiveBatch(true);
    if (isInitial) setInitialGenreLoading(true);

    try {
      let url = `/api/roblox/discover?genre=${encodeURIComponent(targetGenre)}&limit=30`;
      if (targetToken) {
        url += `&pageToken=${encodeURIComponent(targetToken)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games) && data.games.length > 0) {
          addGamesToCatalog(data.games);
          setNextPageToken(data.nextPageToken || undefined);
          setHasMoreLive(Boolean(data.hasMore) && Boolean(data.nextPageToken));
          if (isInitial) {
            setVisibleCount(INITIAL_VISIBLE_COUNT);
          } else {
            // Naikkan visibleCount agar langsung menampilkan batch game yang baru saja ditarik
            setVisibleCount(prev => prev + BATCH_SIZE);
          }
        } else {
          setHasMoreLive(false);
        }
      } else {
        // Jika server Roblox atau RoProxy rate limit (429) atau error, stop live stream agar tidak looping
        setHasMoreLive(false);
      }
    } catch (e) {
      console.error('Failed to fetch next discover batch:', e);
      setHasMoreLive(false);
    } finally {
      setIsFetchingLiveBatch(false);
      if (isInitial) setInitialGenreLoading(false);
    }
  };

  // Lazy render: ONLY games visible in current slice are loaded into the DOM
  const visibleGames = sortedGames.slice(0, visibleCount);
  const hasMore = visibleCount < sortedGames.length || (hasMoreLive && !searchQuery.trim());

  // Infinite scroll: auto-reveal local slice AND continuously fetch next Roblox stream batch
  useEffect(() => {
    if (!hasMore || isLoadingMore || isFetchingLiveBatch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingMore && !isFetchingLiveBatch) {
          if (visibleCount < sortedGames.length) {
            setIsLoadingMore(true);
            setTimeout(() => {
              setVisibleCount(prev => Math.min(prev + BATCH_SIZE, sortedGames.length));
              setIsLoadingMore(false);
            }, 100);
          } else if (!searchQuery.trim() && hasMoreLive) {
            // Hanya panggil live batch berikutnya jika semua game lokal sudah tampil
            fetchNextDiscoverBatch();
          }
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.05
      }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoadingMore, isFetchingLiveBatch, visibleCount, sortedGames.length, hasMoreLive, searchQuery, nextPageToken]);

  // Cross-Genre Dynamic Spotlight: Showcases the #1 TOP experience from EACH genre
  // Completely independent of the catalog's selected genre filter
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState(false);

  // Dynamically compute candidates: #1 top experience from each genre category in Roblox
  const spotlightCandidates = useMemo<{ game: Game; genreCategory: string }[]>(() => {
    const list: { game: Game; genreCategory: string }[] = [];
    const usedIds = new Set<string>();

    // 1. Overall #1 Platform-Wide Trending game
    const overallTop = [...uniqueGames].sort((a, b) => {
      const aPlayers = a.playerCount || 0;
      const bPlayers = b.playerCount || 0;
      if (bPlayers !== aPlayers) return bPlayers - aPlayers;
      return (b.ratingAverage || 0) - (a.ratingAverage || 0);
    })[0];

    if (overallTop) {
      list.push({ game: overallTop, genreCategory: 'Platform Trending' });
      usedIds.add(overallTop.id);
    }

    // 2. #1 Top experience from EACH genre category
    const specificGenres = GENRE_CATEGORIES.filter(c => c !== 'All');
    for (const cat of specificGenres) {
      const matching = uniqueGames
        .filter(g => isGameInGenreCategory(g, cat))
        .sort((a, b) => {
          const aPlayers = a.playerCount || 0;
          const bPlayers = b.playerCount || 0;
          if (bPlayers !== aPlayers) return bPlayers - aPlayers;
          return (b.ratingAverage || 0) - (a.ratingAverage || 0);
        });

      if (matching.length > 0) {
        // Pick the top game in this genre (preferably not already featured in slide 0)
        const topGame = matching.find(g => !usedIds.has(g.id)) || matching[0];
        if (topGame) {
          list.push({ game: topGame, genreCategory: cat });
          usedIds.add(topGame.id);
        }
      }
    }

    return list;
  }, [uniqueGames]);

  const activeSpotlightIndex = spotlightCandidates.length > 0
    ? ((spotlightIndex % spotlightCandidates.length) + spotlightCandidates.length) % spotlightCandidates.length
    : 0;

  const currentSpotlight = spotlightCandidates[activeSpotlightIndex];
  const spotlightGame = currentSpotlight?.game || uniqueGames[0];
  const spotlightGenre = currentSpotlight?.genreCategory || spotlightGame?.genre || 'Featured';

  // Auto-rotate / Slideshow interval (every 6 seconds, pauses on hover / interaction)
  useEffect(() => {
    if (isSpotlightPaused || spotlightCandidates.length <= 1) return;

    const interval = setInterval(() => {
      setSpotlightIndex(prev => (prev + 1) % spotlightCandidates.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isSpotlightPaused, spotlightCandidates.length]);

  const handlePrevSpotlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (spotlightCandidates.length <= 1) return;
    setSpotlightIndex(prev => (prev - 1 + spotlightCandidates.length) % spotlightCandidates.length);
  };

  const handleNextSpotlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (spotlightCandidates.length <= 1) return;
    setSpotlightIndex(prev => (prev + 1) % spotlightCandidates.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      {/* Top Navigation */}
      <Navbar />

      {/* Main View Switcher */}
      <main className="flex-1">
        {activeTab === 'catalog' && (
          <div className="pb-24">
            {/* Spotlight: flat ground, editorial text left, poster right. No background image. */}
            {spotlightGame && (
              <section
                onMouseEnter={() => setIsSpotlightPaused(true)}
                onMouseLeave={() => setIsSpotlightPaused(false)}
                onTouchStart={() => setIsSpotlightPaused(true)}
                onTouchEnd={() => { setTimeout(() => setIsSpotlightPaused(false), 3500); }}
                className="border-b border-line"
              >
                <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-16">
                  <div className="max-w-[560px] flex-1">
                    <p className="bb-label">
                      {language === 'id' ? 'Sorotan' : 'Spotlight'} · {spotlightGenre}
                    </p>

                    <h1 className="bb-display mt-2 line-clamp-2 text-[22px] sm:text-[28px] md:text-[36px] lg:text-[44px]">
                      {spotlightGame.name}
                    </h1>

                    <p className="mt-2.5 line-clamp-2 max-w-[520px] text-[13px] sm:text-[14px] leading-relaxed text-muted">
                      {spotlightGame.description || t('hero_desc')}
                    </p>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-[12px] text-faint">
                      <span className="flex items-center gap-1 font-semibold text-orange">
                        <Star className="h-3.5 w-3.5 fill-orange" strokeWidth={0} />
                        {spotlightGame.ratingAverage.toFixed(1)}
                      </span>
                      <span className="h-3 w-px bg-panel-2" />
                      <span>{(spotlightGame.playerCount || 0).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} {t('card_online')}</span>
                      {spotlightGame.creatorName && (
                        <>
                          <span className="h-3 w-px bg-panel-2" />
                          <span className="truncate">
                            {language === 'id' ? 'oleh' : 'by'} <span className="text-ink">{spotlightGame.creatorName}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center gap-2.5">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => viewGame(spotlightGame.id)} className="bb-btn bb-btn-primary justify-center min-h-[40px] px-4">
                          {language === 'id' ? 'Lihat detail & log' : 'View details & log'}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`https://www.roblox.com/games/${spotlightGame.rootPlaceId || spotlightGame.universeId || spotlightGame.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bb-btn bb-btn-secondary justify-center min-h-[40px] px-4"
                        >
                          {t('detail_play_roblox')}
                          <ExternalLink className="h-3 w-3 text-faint" />
                        </a>
                      </div>
                      <button
                        onClick={() => setUrlImportModalOpen(true)}
                        className="text-[12px] font-semibold text-faint underline-offset-4 hover:text-ink hover:underline py-1.5 text-center sm:text-left sm:ml-2"
                      >
                        {language === 'id' ? 'Impor game' : 'Import game'}
                      </button>
                    </div>
                  </div>

                  {/* Poster + index, centered on mobile */}
                  <div className="flex shrink-0 flex-col items-center sm:items-end gap-2 self-center md:self-auto">
                    <button
                      onClick={() => viewGame(spotlightGame.id)}
                      className="bb-poster w-[140px] sm:w-[170px] md:w-[190px] hover:border-line"
                      aria-label={spotlightGame.name}
                    >
                      <img
                        key={spotlightGame.id}
                        src={safeImgSrc(spotlightGame.iconUrl)}
                        alt={spotlightGame.name}
                        loading="eager"
                        fetchPriority="high"
                        decoding="sync"
                      />
                    </button>

                    {spotlightCandidates.length > 1 && (
                      <div className="flex w-[150px] flex-col gap-2 sm:w-[190px]">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-[13px] tabular-nums text-faint">
                            {String(activeSpotlightIndex + 1).padStart(2, '0')} / {String(spotlightCandidates.length).padStart(2, '0')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setIsSpotlightPaused(prev => !prev)}
                              className="p-0.5 text-faint hover:text-ink"
                              aria-label={isSpotlightPaused ? 'Play slideshow' : 'Pause slideshow'}
                            >
                              {isSpotlightPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={handlePrevSpotlight}
                              className="p-0.5 text-faint hover:text-ink"
                              aria-label="Previous spotlight"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={handleNextSpotlight}
                              className="p-0.5 text-faint hover:text-ink"
                              aria-label="Next spotlight"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {spotlightCandidates.length > 1 && (
                  <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
                    <div className="h-px w-full bg-panel-2-soft">
                      <div
                        key={activeSpotlightIndex}
                        className="h-px bg-green/70 animate-spotlight-progress"
                        style={{ animationPlayState: isSpotlightPaused ? 'paused' : 'running' }}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6">
              {/* Smart Discovery / Mood Picker Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 mb-8 rounded-[3px] bg-panel border border-line shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-[3px] bg-green/15 text-green border border-green/25 flex-shrink-0 mt-0.5 sm:mt-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{language === 'id' ? 'Lagi Mau Main Apa?' : 'What Should We Play?'}</span>
                      <span className="text-[10px] font-semibold text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider">
                        {language === 'id' ? 'Kurasi' : 'Curated'}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                      {language === 'id'
                        ? 'Cari game bagus tanpa harus scroll feed Roblox yang itu-itu aja.'
                        : 'Find solid games without digging through bloated Roblox feeds.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSurpriseModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-[3px] bg-green hover:bg-[#00c94b] text-black font-bold text-xs shadow-[0_2px_12px_rgba(0,224,84,0.3)] transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>{language === 'id' ? 'Pilihkan Game' : 'Find a Game'}</span>
                </button>
              </div>

              {/* Catalog header: label, serif title, count on the left; sort on the right */}
              <div className="bb-section-head flex-col sm:flex-row sm:items-end gap-3">
                <div className="min-w-0 flex-1">
                  <p className="bb-label">{t('catalog_title')}</p>
                  <h2 className="bb-display mt-1 text-[20px] sm:text-[24px] md:text-[28px]">
                    {searchQuery.trim()
                      ? (language === 'id' ? `Hasil untuk “${searchQuery}”` : `Results for “${searchQuery}”`)
                      : (language === 'id' ? 'Semua pengalaman' : 'All experiences')}
                  </h2>
                </div>

                <div className="flex shrink-0 items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-faint">
                    {sortedGames.length} {language === 'id' ? 'game' : 'games'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => refreshRealtimeStats()}
                      disabled={isRealtimeSyncing}
                      className="flex h-7 w-7 items-center justify-center border border-line text-muted hover:border-line hover:text-white disabled:opacity-50"
                      title={language === 'id' ? 'Segarkan data dari Roblox' : 'Refresh Roblox data'}
                    >
                      <RotateCcw className={`h-3 w-3 ${isRealtimeSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        startTransition(() => setSortBy(val));
                      }}
                      aria-label={t('catalog_sort_by')}
                      className="h-7 border border-line bg-panel px-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted outline-none hover:border-line"
                    >
                      <option value="popular" className="bg-panel text-ink">{t('sort_popular')}</option>
                      <option value="rating" className="bg-panel text-ink">{t('sort_rating')}</option>
                      <option value="visits" className="bg-panel text-ink">{t('sort_visits')}</option>
                      <option value="newest" className="bg-panel text-ink">{t('sort_newest')}</option>
                      <option value="az" className="bg-panel text-ink">{t('sort_az')}</option>
                    </select>
                    {searchQuery.trim() && (
                      <button onClick={() => setSearchQuery('')} className="bb-btn bb-btn-ghost h-7 px-2 text-[11px]">
                        {language === 'id' ? 'Hapus' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visibleGames.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    layout="grid"
                    userLog={userLogMap.get(game.id) || null}
                    priority={index < 6}
                  />
                ))}
              </div>

              {isFetchingLiveBatch && (
                <div className="mt-6">
                  <GameGridSkeleton count={6} layout="grid" />
                </div>
              )}

              <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />

              {sortedGames.length > 0 && (
                <div className="flex flex-col items-center gap-3 border-t border-line-soft py-6">
                  <p className="text-[11px] text-faint">
                    {visibleGames.length} / {sortedGames.length} {language === 'id' ? 'game' : 'games'}
                    {sortedGames.length > visibleGames.length
                      ? ` · +${sortedGames.length - visibleGames.length} ${language === 'id' ? 'lagi' : 'more'}`
                      : hasMoreLive && !searchQuery.trim() ? (language === 'id' ? ' · live stream' : ' · live stream') : ''}
                  </p>

                  {hasMore ? (
                    <button
                      onClick={() => {
                        if (visibleCount < sortedGames.length) {
                          setIsLoadingMore(true);
                          setTimeout(() => {
                            setVisibleCount(prev => Math.min(prev + BATCH_SIZE, sortedGames.length));
                            setIsLoadingMore(false);
                          }, 100);
                        } else if (!searchQuery.trim() && hasMoreLive) {
                          fetchNextDiscoverBatch('All', nextPageToken);
                        }
                      }}
                      disabled={isLoadingMore || isFetchingLiveBatch}
                      className="bb-btn bb-btn-secondary"
                    >
                      {(isLoadingMore || isFetchingLiveBatch) ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {t('catalog_loading_more')}
                        </>
                      ) : (
                        <>
                          {visibleGames.length < sortedGames.length
                            ? (language === 'id' ? 'Muat lebih banyak' : 'Load more')
                            : t('catalog_explore_more_all')}
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] text-faint">
                      <CheckCircle2 className="h-3 w-3 text-green" />
                      {language === 'id' ? 'Semua game telah dimuat' : 'All games loaded'}
                    </span>
                  )}
                </div>
              )}

              {(initialGenreLoading || (isFetchingLiveBatch && sortedGames.length === 0)) && (
                <div className="py-4">
                  <GameGridSkeleton count={10} layout="grid" />
                </div>
              )}

              {!initialGenreLoading && !isFetchingLiveBatch && sortedGames.length === 0 && (
                <div className="border-t border-line py-16 text-center">
                  {searchQuery.trim() ? (
                    <>
                      <p className="bb-display text-[22px]">
                        {language === 'id' ? `Tidak ada yang cocok dengan “${searchQuery}”` : `Nothing matches “${searchQuery}”`}
                      </p>
                      <p className="mx-auto mt-2 max-w-md text-[13px] text-muted">
                        {language === 'id'
                          ? 'Cari langsung ke seluruh database Roblox, atau impor lewat link.'
                          : 'Search the whole Roblox database, or import by link.'}
                      </p>

                      {onlineSearchError && (
                        <p className="mx-auto mt-3 max-w-md border border-line px-3 py-1.5 text-[12px] text-orange">
                          {onlineSearchError}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => handleSearchRobloxLive()}
                          disabled={isSearchingOnline}
                          className="bb-btn bb-btn-primary"
                        >
                          {isSearchingOnline ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {language === 'id' ? 'Mencari...' : 'Searching...'}
                            </>
                          ) : (
                            <>
                              <Globe2 className="h-3.5 w-3.5" />
                              {language === 'id' ? 'Cari di seluruh Roblox' : 'Search all of Roblox'}
                            </>
                          )}
                        </button>
                        <button onClick={() => setUrlImportModalOpen(true)} className="bb-btn bb-btn-secondary">
                          {language === 'id' ? 'Impor link / ID' : 'Import link / ID'}
                        </button>
                        <button onClick={() => setSearchQuery('')} className="bb-btn bb-btn-ghost">
                          {language === 'id' ? 'Hapus pencarian' : 'Clear search'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="bb-display text-[22px]">
                        {language === 'id' ? 'Katalog kosong' : 'Empty catalog'}
                      </p>
                      <button
                        onClick={() => fetchNextDiscoverBatch('All', undefined, true)}
                        className="bb-btn bb-btn-primary mt-4"
                      >
                        {language === 'id' ? 'Tarik game dari Roblox' : 'Fetch games from Roblox'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View: Game Details */}
        {activeTab === 'game-detail' && (
          <Suspense fallback={<ViewLoader text={language === 'id' ? "Memuat detail pengalaman..." : "Loading experience details..."} />}>
            <GameDetailView />
          </Suspense>
        )}

        {/* View: User Profile */}
        {activeTab === 'profile' && (
          <Suspense fallback={<ViewLoader text={language === 'id' ? "Memuat profil pengguna..." : "Loading user profile..."} />}>
            <ProfileView />
          </Suspense>
        )}

        {/* View: Diary */}
        {activeTab === 'diary' && (
          <Suspense fallback={<ViewLoader text={language === 'id' ? "Memuat catatan diary..." : "Loading diary..."} />}>
            <DiaryView />
          </Suspense>
        )}

        {/* View: Lists */}
        {(activeTab === 'lists' || activeTab === 'list-detail') && (
          <Suspense fallback={<ViewLoader text={language === 'id' ? "Memuat koleksi lists..." : "Loading lists..."} />}>
            <ListsView />
          </Suspense>
        )}

        {/* View: Community */}
        {activeTab === 'community' && (
          <Suspense fallback={<ViewLoader text={language === 'id' ? "Memuat feed komunitas..." : "Loading community feed..."} />}>
            <CommunityView />
          </Suspense>
        )}
      </main>

      {/* Footer: flat ground, hairline top, no brand colour */}
      <footer className="mt-auto border-t border-line bg-bg px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <BloxboxdLogo size="sm" />
            <span className="font-serif text-[17px] font-semibold tracking-[-0.02em] text-white">bloxboxd</span>
            <span className="text-[12px] text-faint">{t('footer_tagline')}</span>
          </div>

          <div className="max-w-md text-[11px] leading-relaxed text-faint sm:text-right">
            <p>{t('footer_disclaimer')}</p>
          </div>
        </div>
      </footer>

      {/* Global Modals (Lazy Loaded) */}
      <Suspense fallback={null}>
        <LogModal />
        <RobloxUrlModal />
        <EditProfileModal />
        <RobloxLoginModal />
        <SurpriseMeModal isOpen={surpriseModalOpen} onClose={() => setSurpriseModalOpen(false)} />
      </Suspense>

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />

      {/* Global Confirmation Dialog & Toast Notifications */}
      <ConfirmModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
