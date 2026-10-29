import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  Play, 
  Bookmark, 
  Star, 
  Users, 
  Check, 
  RotateCw, 
  Compass,
  User,
  Users as UsersIcon,
  Swords,
  Gamepad2,
  Sparkles,
  Ghost,
  Crosshair,
  Coffee,
  Gem,
  Loader2
} from 'lucide-react';
import { Game, safeImgSrc } from '../types';
import { useApp } from '../context/AppContext';
import { 
  PLAY_STYLES, 
  FOCUSED_CATEGORIES, 
  PlayStyle, 
  FocusedCategory, 
  isGameMatchingFocus, 
  launchRobloxExperience 
} from '../utils/vibe';

interface SurpriseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const renderStyleIcon = (name: string) => {
  switch (name) {
    case 'User': return <User className="w-3.5 h-3.5" />;
    case 'Users': return <UsersIcon className="w-3.5 h-3.5" />;
    case 'Swords': return <Swords className="w-3.5 h-3.5" />;
    default: return <Gamepad2 className="w-3.5 h-3.5" />;
  }
};

const renderCategoryIcon = (name: string) => {
  switch (name) {
    case 'Ghost': return <Ghost className="w-3.5 h-3.5" />;
    case 'Crosshair': return <Crosshair className="w-3.5 h-3.5" />;
    case 'Coffee': return <Coffee className="w-3.5 h-3.5" />;
    case 'Compass': return <Compass className="w-3.5 h-3.5" />;
    case 'Gem': return <Gem className="w-3.5 h-3.5" />;
    default: return <Sparkles className="w-3.5 h-3.5" />;
  }
};

export const SurpriseMeModal: React.FC<SurpriseMeModalProps> = ({ isOpen, onClose }) => {
  const { games, viewGame, toggleGameStatus, getUserLogForGame, user, language, showToast, addGamesToCatalog } = useApp();

  const [selectedStyle, setSelectedStyle] = useState<PlayStyle>('coop');
  const [selectedCategory, setSelectedCategory] = useState<FocusedCategory>('horror');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const pageTokensRef = useRef<Record<string, string | undefined>>({});
  const lastFetchedCatRef = useRef<string | null>(null);

  // Fetch fresh batch of live Roblox games from the official Omni-Search / Discover API
  const fetchLiveCategoryBatch = useCallback(async (cat: FocusedCategory) => {
    let apiGenre = 'All';
    if (cat === 'horror') apiGenre = 'Survival';
    else if (cat === 'fps') apiGenre = 'Shooter';
    else if (cat === 'cozy') apiGenre = 'Roleplay & Avatar Sim';
    else if (cat === 'story') apiGenre = 'RPG';

    const currentToken = pageTokensRef.current[cat];
    setIsLoadingLive(true);
    try {
      const url = `/api/roblox/discover?genre=${encodeURIComponent(apiGenre)}&limit=30${currentToken ? `&pageToken=${encodeURIComponent(currentToken)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games) && data.games.length > 0) {
          addGamesToCatalog(data.games);
          if (data.nextPageToken) {
            pageTokensRef.current[cat] = data.nextPageToken;
          }
        }
      }
    } catch (e) {
      console.warn('Live discover fetch error in finder:', e);
    } finally {
      setIsLoadingLive(false);
    }
  }, [addGamesToCatalog]);

  // When category changes, pull a fresh live batch from Roblox if category has not been fetched yet
  useEffect(() => {
    if (!isOpen) return;
    if (lastFetchedCatRef.current !== selectedCategory) {
      lastFetchedCatRef.current = selectedCategory;
      fetchLiveCategoryBatch(selectedCategory);
    }
  }, [isOpen, selectedCategory, fetchLiveCategoryBatch]);

  const matchingGames = useMemo(() => {
    return games.filter(g => isGameMatchingFocus(g, selectedStyle, selectedCategory));
  }, [games, selectedStyle, selectedCategory]);

  const showcaseGames = useMemo(() => {
    if (matchingGames.length === 0) return [];
    
    // Sort by balanced score of rating and active player volume
    const sorted = [...matchingGames].sort((a, b) => {
      const scoreA = (a.ratingAverage * 10) + Math.min(10, Math.log10(Math.max(1, a.playerCount || 0)) * 2);
      const scoreB = (b.ratingAverage * 10) + Math.min(10, Math.log10(Math.max(1, b.playerCount || 0)) * 2);
      return scoreB - scoreA;
    });

    if (sorted.length <= 3) return sorted;

    const offset = (shuffleSeed * 3) % sorted.length;
    const batch = [];
    for (let i = 0; i < 3; i++) {
      batch.push(sorted[(offset + i) % sorted.length]);
    }
    return batch;
  }, [matchingGames, shuffleSeed]);

  if (!isOpen) return null;

  const handleShuffle = () => {
    setShuffleSeed(prev => prev + 1);
    // If approaching the end of current local matches, fetch another batch live from Roblox
    if (matchingGames.length < (shuffleSeed + 2) * 3) {
      fetchLiveCategoryBatch(selectedCategory);
    }
  };

  const handleSaveBacklog = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    if (!user) {
      showToast(language === 'id' ? 'Masuk dulu untuk simpan game ini' : 'Sign in to save this game', 'info');
      return;
    }
    const isBacklog = getUserLogForGame(game.id)?.status === 'backlog';
    toggleGameStatus(game.id, 'backlog');
    showToast(
      isBacklog 
        ? (language === 'id' ? 'Dihapus dari Backlog' : 'Removed from Backlog')
        : (language === 'id' ? `"${game.name}" tersimpan di Backlog!` : `"${game.name}" saved to Backlog!`),
      'success'
    );
  };

  const handleViewDetail = (gameId: string) => {
    viewGame(gameId);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-2xl rounded-[3px] bg-panel border border-line p-5 sm:p-6 shadow-[0_20px_48px_rgba(0,0,0,0.7)] space-y-5 my-8 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3.5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[3px] bg-green/15 text-green border border-green/25">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {language === 'id' ? 'Cari Game Buat Dimainkan' : 'Find What to Play'}
              </h3>
              <p className="text-[11px] text-muted">
                {language === 'id' ? 'Pilih gaya main dan temanya, kami carikan yang paling pas.' : 'Pick your group size and mood, we will find the right picks.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-muted hover:text-white p-1 rounded-[2px] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3 flex-shrink-0 bg-bg p-3 rounded-[3px] border border-line">
          {/* Step 1: Main sama siapa */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green block">
              {language === 'id' ? '1. Main sama siapa?' : '1. Who is playing?'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PLAY_STYLES.map(style => {
                const active = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      setSelectedStyle(style.id);
                      setShuffleSeed(0);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold transition-all cursor-pointer truncate ${
                      active
                        ? 'bg-green text-black shadow-[0_2px_8px_rgba(0,224,84,0.25)]'
                        : 'bg-panel hover:bg-panel-2 text-ink hover:text-white border border-line'
                    }`}
                  >
                    <span className="flex-shrink-0">{renderStyleIcon(style.iconName)}</span>
                    <span className="truncate">{language === 'id' ? style.labelId : style.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Mau tema apa */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green">
                {language === 'id' ? '2. Mau tema apa?' : '2. Pick a mood'}
              </span>
              <span className="text-[10px] text-faint flex items-center gap-1.5">
                {isLoadingLive && <Loader2 className="w-3 h-3 animate-spin text-green" />}
                <span>{matchingGames.length} {language === 'id' ? 'game cocok' : 'games'}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FOCUSED_CATEGORIES.map(cat => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setShuffleSeed(0);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.25)]'
                        : 'bg-panel hover:bg-panel-2 text-ink hover:text-white border border-line'
                    }`}
                  >
                    <span className="flex-shrink-0">{renderCategoryIcon(cat.iconName)}</span>
                    <span>{language === 'id' ? cat.labelId : cat.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Showcase Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {showcaseGames.length > 0 ? (
            showcaseGames.map((game, index) => {
              const isBacklog = getUserLogForGame(game.id)?.status === 'backlog';
              const totalVotes = (game.upVotes || 0) + (game.downVotes || 0);
              const likePct = totalVotes > 0 ? Math.round(((game.upVotes || 0) / totalVotes) * 100) : 90;

              return (
                <div 
                  key={game.id}
                  className="p-3 rounded-[3px] bg-bg border border-line hover:border-line-soft transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div 
                    onClick={() => handleViewDetail(game.id)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={safeImgSrc(game.iconUrl)}
                      alt={game.name}
                      className="w-13 h-13 rounded-[3px] object-cover border border-line flex-shrink-0 bg-black group-hover:border-green/50 transition-colors"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-green uppercase tracking-wider bg-green/10 border border-green/20 px-1.5 py-0.2 rounded-[2px]">
                          #{index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-green transition-colors">
                          {game.name}
                        </h4>
                      </div>

                      <p className="text-[11px] text-muted truncate">
                        {game.creatorName} · <span className="text-ink">{game.genre}</span>
                      </p>

                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span className="flex items-center gap-1 text-orange font-bold">
                          <Star className="w-3 h-3 fill-orange" />
                          <span>{game.ratingAverage.toFixed(1)}</span>
                        </span>
                        <span className="text-faint">·</span>
                        <span className="text-green font-medium">
                          {likePct}% suka
                        </span>
                        {game.playerCount !== undefined && game.playerCount > 0 && (
                          <>
                            <span className="text-faint">·</span>
                            <span className="text-muted flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{game.playerCount.toLocaleString()}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 border-line/60 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={(e) => handleSaveBacklog(e, game)}
                      title={isBacklog ? (language === 'id' ? 'Di Backlog' : 'In Backlog') : (language === 'id' ? 'Simpan ke Backlog' : 'Save to Backlog')}
                      className={`p-2 rounded-[2px] border transition-colors cursor-pointer ${
                        isBacklog 
                          ? 'bg-green/15 text-green border-green/30' 
                          : 'bg-panel hover:bg-panel-2 text-muted hover:text-white border-line'
                      }`}
                    >
                      {isBacklog ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => launchRobloxExperience(game.rootPlaceId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-green hover:bg-[#00c94b] text-black font-bold text-xs shadow-[0_2px_8px_rgba(0,224,84,0.25)] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'id' ? 'Mainkan' : 'Play'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 space-y-2.5 bg-bg rounded-[3px] border border-line">
              <p className="text-xs text-muted">
                {isLoadingLive 
                  ? (language === 'id' ? 'Sedang mencari game dari server Roblox...' : 'Fetching live experiences from Roblox...')
                  : (language === 'id' ? 'Belum ada game yang cocok dengan pilihan ini.' : 'No games match this combination yet.')}
              </p>
              {!isLoadingLive && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStyle('all');
                    setSelectedCategory('all');
                  }}
                  className="bb-btn bb-btn-primary text-xs"
                >
                  {language === 'id' ? 'Tampilkan Semua' : 'Reset All'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-3 flex-shrink-0 text-xs">
          <p className="text-faint text-[11px]">
            {language === 'id' ? 'Klik Mainkan untuk langsung buka game di Roblox.' : 'Click Play to launch directly in Roblox.'}
          </p>

          <button
            type="button"
            disabled={isLoadingLive}
            onClick={handleShuffle}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-green disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-green' : ''}`} />
            <span>{language === 'id' ? 'Ganti Pilihan' : 'Show Others'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
