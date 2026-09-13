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

const ViewLoader: React.FC<{ text?: string }> = ({ text = 'Memuat tampilan...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] w-full py-20">
    <div className="w-10 h-10 rounded-full border-3 border-[#00E59B] border-t-transparent animate-spin mb-3" />
    <span className="text-xs font-semibold text-gray-400">{text}</span>
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
          setOnlineSearchError(`Tidak menemukan game untuk "${q}". Coba nama lain atau masukkan link / Place ID.`);
        }
      } else {
        setOnlineSearchError('Gagal menghubungi server Roblox. Coba lagi sebentar.');
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
    <div className="min-h-screen flex flex-col bg-[#14181c] text-[#e0e6ed]">
      {/* Top Navigation */}
      <Navbar />

      {/* Main View Switcher */}
      <main className="flex-1">
        {activeTab === 'catalog' && (
          <div className="pb-24">
            {/* Spotlight Hero Banner (Multi-Genre Live Showcase Slideshow) */}
            {spotlightGame && (
              <div 
                onMouseEnter={() => setIsSpotlightPaused(true)}
                onMouseLeave={() => setIsSpotlightPaused(false)}
                onTouchStart={() => setIsSpotlightPaused(true)}
                onTouchEnd={() => {
                  setTimeout(() => setIsSpotlightPaused(false), 3500);
                }}
                className="relative border-b border-[#232b35] overflow-hidden bg-[#111418] transition-colors duration-500 group/banner"
              >
                {/* Background image with blur and dark gradient */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <img
                    key={spotlightGame.id}
                    src={safeImgSrc(spotlightGame.bannerUrl || spotlightGame.iconUrl)}
                    alt={spotlightGame.name}
                    className="w-full h-full object-cover opacity-25 filter blur-xs scale-105 transition-opacity duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-[#14181c]/75 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#14181c] via-[#14181c]/85 to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="max-w-2xl space-y-4 flex-1">
                    {/* Badge & Carousel Controls Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E59B]/15 border border-[#00E59B]/30 text-[#00E59B] text-xs font-bold tracking-wider uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {spotlightGenre === 'Platform Trending'
                            ? (language === 'id' ? '🔥 #1 Trending di Roblox' : '🔥 #1 Trending on Roblox')
                            : (language === 'id' ? `✨ #1 Top di Genre ${spotlightGenre}` : `✨ #1 Top in ${spotlightGenre}`)}
                        </span>
                      </div>

                      {/* Pagination & Auto-Rotate Controls */}
                      {spotlightCandidates.length > 1 && (
                        <div className="flex items-center gap-1.5 bg-[#171d24]/90 backdrop-blur-md px-2 py-1 rounded-xl border border-[#2b3542] shadow-sm">
                          {/* Play / Pause Toggle Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsSpotlightPaused(prev => !prev);
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#252f3b] transition-colors cursor-pointer"
                            title={isSpotlightPaused ? (language === 'id' ? "Lanjutkan auto-rotate" : "Resume slideshow") : (language === 'id' ? "Jeda auto-rotate" : "Pause slideshow")}
                            aria-label={isSpotlightPaused ? "Play slideshow" : "Pause slideshow"}
                          >
                            {isSpotlightPaused ? (
                              <Play className="w-3.5 h-3.5 text-[#00E59B]" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="w-[1px] h-3.5 bg-[#2b3542]" />

                          <button
                            onClick={handlePrevSpotlight}
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#252f3b] transition-colors cursor-pointer"
                            title={language === 'id' ? "Lihat genre spotlight sebelumnya" : "View previous spotlight"}
                            aria-label="Previous Spotlight"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1 px-1">
                            {spotlightCandidates.map((c, idx) => (
                              <button
                                key={c.game.id || idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSpotlightIndex(idx);
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                  idx === activeSpotlightIndex
                                    ? 'w-4 bg-[#00E59B]'
                                    : 'w-1.5 bg-gray-600 hover:bg-gray-400'
                                }`}
                                title={`#1 ${c.genreCategory}: ${c.game.name}`}
                                aria-label={`#1 ${c.genreCategory}: ${c.game.name}`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={handleNextSpotlight}
                            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#252f3b] transition-colors cursor-pointer"
                            title={language === 'id' ? "Lihat genre spotlight berikutnya" : "View next spotlight"}
                            aria-label="Next Spotlight"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                      {spotlightGame.name}
                    </h1>

                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed line-clamp-3">
                      {spotlightGame.description || t('hero_desc')}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold pt-1">
                      <div className="flex items-center gap-1.5 text-[#00E59B] font-bold text-xs sm:text-sm bg-black/60 px-3 py-1.5 rounded-lg border border-[#00E59B]/20">
                        <Star className="w-4 h-4 fill-[#00E59B]" />
                        <span>{spotlightGame.ratingAverage.toFixed(1)} / 5.0</span>
                      </div>

                      <span className="text-gray-300 bg-[#1e2630] px-3 py-1.5 rounded-lg border border-[#2b3542] text-xs font-semibold">
                        {spotlightGenre}
                      </span>

                      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E59B] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E59B]"></span>
                        </span>
                        <span>{(spotlightGame.playerCount || 0).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} {t('card_online')}</span>
                      </div>

                      {spotlightGame.creatorName && (
                        <span className="text-gray-400 text-xs py-1.5 hidden sm:inline-block">
                          {language === 'id' ? 'Oleh' : 'By'} <strong className="text-gray-200">{spotlightGame.creatorName}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <button
                        onClick={() => viewGame(spotlightGame.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(0,229,155,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{language === 'id' ? 'Lihat Detail & Log' : 'View Details & Log'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <a
                        href={`https://www.roblox.com/games/${spotlightGame.rootPlaceId || spotlightGame.universeId || spotlightGame.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#1e2630] hover:bg-[#283341] text-white text-xs font-bold transition-colors border border-[#2e3947] flex items-center justify-center gap-2"
                      >
                        <Gamepad2 className="w-4 h-4 text-[#00E59B]" />
                        <span>{t('detail_play_roblox')}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </a>

                      <button
                        onClick={() => setUrlImportModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-[#222a33]/60 hover:bg-[#2c3642] text-gray-300 hover:text-white text-xs font-bold transition-colors border border-[#313c49] text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-gray-400" />
                        <span>{language === 'id' ? 'Impor Game' : 'Import Game'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Spotlight Poster Card */}
                  <div 
                    onClick={() => viewGame(spotlightGame.id)}
                    className="cursor-pointer group flex-shrink-0 mx-auto md:mx-0 relative"
                  >
                    <div className="w-44 sm:w-56 md:w-60 aspect-square rounded-2xl overflow-hidden border-2 border-[#2c3644] group-hover:border-[#00E59B] shadow-2xl transition-all group-hover:scale-105 duration-300 relative bg-[#182028]">
                      <img
                        key={spotlightGame.id}
                        src={safeImgSrc(spotlightGame.iconUrl)}
                        alt={spotlightGame.name}
                        loading="eager"
                        fetchPriority="high"
                        decoding="sync"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <span className="text-[11px] font-bold text-[#00E59B] flex items-center gap-1">
                          <span>{language === 'id' ? 'Buka Detail' : 'View Details'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    {/* Rank Badge on Poster */}
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 text-[10px] font-black text-white flex items-center gap-1 shadow-lg">
                      <span className="text-[#00E59B]">#1</span>
                      <span>{spotlightGenre === 'Platform Trending' ? 'Trending' : spotlightGenre}</span>
                    </div>
                  </div>
                </div>

                {/* Auto-Slide Progress Bar Indicator */}
                {spotlightCandidates.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/40 overflow-hidden z-20">
                    <div 
                      key={activeSpotlightIndex}
                      className="h-full bg-gradient-to-r from-[#00E59B] via-[#00E59B] to-emerald-400 animate-spotlight-progress"
                      style={{
                        animationPlayState: isSpotlightPaused ? 'paused' : 'running'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Catalog Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
              {/* Header with Title, Live Sync Status & Filter Controls */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[#00E59B]" />
                      <span>{t('catalog_title')}</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {language === 'id' 
                        ? 'Jelajahi, beri log dan ulasan pada pengalaman Roblox dengan data resmi real-time' 
                        : 'Explore, log and review Roblox experiences with official real-time data'}
                    </p>
                  </div>

                  {/* Real-time Status & Quick Sort Controls */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Live Roblox API Indicator */}
                    <div 
                      className="flex items-center gap-2 bg-[#182028] border border-[#273341] px-3 py-1.5 rounded-xl text-xs"
                      title={language === 'id' ? "Bloxboxd selalu terhubung langsung dengan official Roblox API" : "Bloxboxd connects directly with official Roblox API"}
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E59B] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E59B]"></span>
                      </span>
                      <span className="text-gray-300 font-semibold hidden sm:inline">Roblox API Live Sync</span>
                      <span className="text-[11px] text-[#00E59B] font-mono font-bold">
                        {isRealtimeSyncing ? (language === 'id' ? 'Memperbarui...' : 'Updating...') : '🟢 Realtime'}
                      </span>
                      <button
                        onClick={() => refreshRealtimeStats()}
                        disabled={isRealtimeSyncing}
                        className="p-1 hover:text-[#00E59B] text-gray-400 rounded transition-colors"
                        title={language === 'id' ? "Segarkan data realtime dari Roblox sekarang" : "Refresh realtime Roblox stats now"}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRealtimeSyncing ? 'animate-spin text-[#00E59B]' : ''}`} />
                      </button>
                    </div>

                    {/* Quick Sort Selector */}
                    <div className="flex items-center gap-1.5 bg-[#182028] border border-[#273341] px-2.5 py-1.5 rounded-xl text-xs">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-400 font-semibold hidden sm:inline">{t('catalog_sort_by')}</span>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          startTransition(() => {
                            setSortBy(val);
                          });
                        }}
                        aria-label={t('catalog_sort_by')}
                        className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                      >
                        <option value="popular" className="bg-[#182028] text-white">{t('sort_popular')}</option>
                        <option value="rating" className="bg-[#182028] text-white">{t('sort_rating')}</option>
                        <option value="visits" className="bg-[#182028] text-white">{t('sort_visits')}</option>
                        <option value="newest" className="bg-[#182028] text-white">{t('sort_newest')}</option>
                        <option value="az" className="bg-[#182028] text-white">{t('sort_az')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Experiences Count Banner & Active Search Query */}
                <div className="flex items-center justify-between text-xs text-gray-400 px-0.5 pt-1 border-t border-[#232b35]/60">
                  <div>
                    {searchQuery.trim() ? (
                      <div className="flex items-center gap-2">
                        <span>
                          {language === 'id' ? (
                            <>Ditemukan <strong className="text-white">{sortedGames.length}</strong> pengalaman cocok dengan "<strong className="text-[#00E59B]">{searchQuery}</strong>"</>
                          ) : (
                            <>Found <strong className="text-white">{sortedGames.length}</strong> experiences matching "<strong className="text-[#00E59B]">{searchQuery}</strong>"</>
                          )}
                        </span>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-2 py-0.5 rounded-full bg-[#242d38] hover:bg-[#303c4a] text-gray-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>✕</span>
                          <span>{language === 'id' ? 'Hapus' : 'Clear'}</span>
                        </button>
                      </div>
                    ) : (
                      <span>
                        {language === 'id' ? (
                          <>Menampilkan <strong className="text-white">{sortedGames.length}</strong> pengalaman di Roblox</>
                        ) : (
                          <>Showing <strong className="text-white">{sortedGames.length}</strong> experiences on Roblox</>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Experiences Grid (Responsive 2 to 6 columns) - Renders ONLY visible slice */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
                {visibleGames.map((game, index) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    layout="grid" 
                    userLog={userLogMap.get(game.id) || null} 
                    priority={index < 4}
                  />
                ))}
              </div>

              {/* Shimmering GameGridSkeleton when fetching next live batch from Roblox */}
              {isFetchingLiveBatch && (
                <div className="mt-4 sm:mt-6">
                  <GameGridSkeleton count={6} layout="grid" />
                </div>
              )}

              {/* Sentinel trigger element for IntersectionObserver */}
              <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />

              {/* Progressive Load More & Infinite Scroll Section */}
              {sortedGames.length > 0 && (
                <div className="pt-6 pb-4 flex flex-col items-center justify-center gap-4">
                  {/* Progress Indicator */}
                  <div className="flex flex-col items-center gap-1.5 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>
                        {language === 'id' ? (
                          <>Menampilkan <strong className="text-white">{visibleGames.length}</strong> dari <strong className="text-white">{sortedGames.length}</strong> game</>
                        ) : (
                          <>Showing <strong className="text-white">{visibleGames.length}</strong> of <strong className="text-white">{sortedGames.length}</strong> games</>
                        )}
                      </span>
                      {sortedGames.length > visibleGames.length ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1e2630] border border-[#2b3542] text-[#00E59B] font-semibold">
                          +{sortedGames.length - visibleGames.length} {language === 'id' ? 'lagi' : 'more'}
                        </span>
                      ) : hasMoreLive && !searchQuery.trim() ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1e2630] border border-[#2b3542] text-[#00E59B] font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00E59B] animate-pulse" />
                          {language === 'id' ? 'Live Stream Roblox' : 'Roblox Live Stream'}
                        </span>
                      ) : null}
                    </div>
                    {/* Visual progress bar */}
                    <div className="w-48 sm:w-64 h-1.5 bg-[#1e2630] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00E59B] to-[#00A2FF] transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((visibleGames.length / sortedGames.length) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Load More Button or Completed Marker */}
                  {hasMore ? (
                    <div className="flex flex-col items-center gap-2">
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
                        className="px-6 py-2.5 bg-[#1b222a] hover:bg-[#232c37] active:scale-95 text-white font-bold text-xs rounded-xl border border-[#2c3746] hover:border-[#00E59B] transition-all flex items-center gap-2 shadow-lg group disabled:opacity-50"
                      >
                        {(isLoadingMore || isFetchingLiveBatch) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#00E59B]" />
                            <span>{t('catalog_loading_more')}</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {visibleGames.length < sortedGames.length 
                                ? (language === 'id' 
                                    ? `Muat Lebih Banyak Game (${Math.max(0, sortedGames.length - visibleGames.length)} lagi)` 
                                    : `Load More Games (${Math.max(0, sortedGames.length - visibleGames.length)} remaining)`) 
                                : t('catalog_explore_more_all')}
                            </span>
                            <ChevronDown className="w-4 h-4 text-[#00E59B] group-hover:translate-y-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-gray-500">
                        {language === 'id' 
                          ? 'Atau scroll ke bawah terus — sistem akan menyedot game baru secara otomatis' 
                          : 'Or keep scrolling — the catalog will discover more games automatically'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-[#171d24] px-4 py-2 rounded-full border border-[#232b35]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E59B]" />
                      <span>
                        {language === 'id' 
                          ? `Semua ${sortedGames.length} game telah dimuat` 
                          : `All ${sortedGames.length} games loaded`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Initial Loading Skeleton when switching genre or first load */}
              {(initialGenreLoading || (isFetchingLiveBatch && sortedGames.length === 0)) && (
                <div className="py-4">
                  <GameGridSkeleton count={10} layout="grid" />
                </div>
              )}

              {/* Empty state when no games match query or genre */}
              {!initialGenreLoading && !isFetchingLiveBatch && sortedGames.length === 0 && (
                <div className="py-16 text-center bg-[#181e24] rounded-2xl border border-[#252f3b] p-8 space-y-4">
                  {searchQuery.trim() ? (
                    <>
                      <p className="text-base font-bold text-white">
                        {language === 'id' 
                          ? `Tidak ada game lokal yang cocok dengan "${searchQuery}".`
                          : `No local experiences match "${searchQuery}".`}
                      </p>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">
                        {language === 'id'
                          ? 'Kamu bisa mencari langsung ke seluruh platform database Roblox via tombol di bawah ini:'
                          : 'You can search across the entire Roblox platform database via the button below:'}
                      </p>

                      {onlineSearchError && (
                        <p className="text-xs text-rose-400 bg-rose-500/10 py-1.5 px-3 rounded-lg max-w-md mx-auto">
                          {onlineSearchError}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => handleSearchRobloxLive()}
                          disabled={isSearchingOnline}
                          className="px-5 py-2.5 bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSearchingOnline ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{language === 'id' ? 'Mencari di Roblox...' : 'Searching Roblox...'}</span>
                            </>
                          ) : (
                            <>
                              <Globe2 className="w-4 h-4" />
                              <span>
                                {language === 'id' 
                                  ? `Cari "${searchQuery}" di Seluruh Game Roblox` 
                                  : `Search "${searchQuery}" across all Roblox games`}
                              </span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setUrlImportModalOpen(true)}
                          className="px-4 py-2.5 bg-[#222a33] text-gray-200 hover:text-white font-bold text-xs rounded-xl border border-[#313c49]"
                        >
                          {language === 'id' ? 'Buka Dialog Import / Link / ID' : 'Open Import Link / ID Dialog'}
                        </button>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-4 py-2.5 bg-transparent text-gray-400 hover:text-white text-xs font-semibold"
                        >
                          {language === 'id' ? 'Hapus Pencarian' : 'Clear Search'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-bold text-white">
                        {language === 'id' ? 'Katalog sedang dimuat...' : 'Catalog is loading...'}
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => fetchNextDiscoverBatch('All', undefined, true)}
                          className="px-5 py-2.5 bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
                        >
                          {language === 'id' ? 'Tarik Game dari Roblox' : 'Fetch Games from Roblox'}
                        </button>
                      </div>
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

      {/* Footer (Letterboxd Style) */}
      <footer className="border-t border-[#232b35] bg-[#101317] py-8 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2.5">
            <BloxboxdLogo size="sm" />
            <span className="font-mono font-bold text-white tracking-wider">
              BLOX<span className="text-[#00E59B]">BOXD</span>
            </span>
            <span>— The Social Catalog & Tracker for Roblox Players</span>
          </div>

          <div className="text-center sm:text-right text-[11px] space-y-0.5">
            <p className="text-gray-400">
              Inspired by Letterboxd & Backloggd. Built for Roblox enthusiasts, curators, and creators.
            </p>
            <p className="text-gray-400">
              Bloxboxd is an independent community catalog and is not affiliated with Roblox Corporation.
            </p>
          </div>
        </div>
      </footer>

      {/* Global Modals (Lazy Loaded) */}
      <Suspense fallback={null}>
        <LogModal />
        <RobloxUrlModal />
        <EditProfileModal />
        <RobloxLoginModal />
      </Suspense>

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />
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
