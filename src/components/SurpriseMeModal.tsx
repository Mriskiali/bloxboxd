import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  Bookmark, 
  Star, 
  Users, 
  ChevronRight,
  Check,
  RotateCw,
  Compass
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

export const SurpriseMeModal: React.FC<SurpriseMeModalProps> = ({ isOpen, onClose }) => {
  const { games, viewGame, toggleGameStatus, getUserLogForGame, user, language, showToast } = useApp();

  const [selectedStyle, setSelectedStyle] = useState<PlayStyle>('coop');
  const [selectedCategory, setSelectedCategory] = useState<FocusedCategory>('horror');
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Filter candidates matching both play style and category strictly
  const matchingGames = useMemo(() => {
    return games.filter(g => isGameMatchingFocus(g, selectedStyle, selectedCategory));
  }, [games, selectedStyle, selectedCategory]);

  // Curated showcase: pick top 3-4 games, supporting shuffling
  const showcaseGames = useMemo(() => {
    if (matchingGames.length === 0) return [];
    
    // Sort by a composite of rating + popularity
    const sorted = [...matchingGames].sort((a, b) => {
      const scoreA = (a.ratingAverage * 10) + Math.min(10, Math.log10(Math.max(1, a.playerCount || 0)) * 2);
      const scoreB = (b.ratingAverage * 10) + Math.min(10, Math.log10(Math.max(1, b.playerCount || 0)) * 2);
      return scoreB - scoreA;
    });

    if (sorted.length <= 3) return sorted;

    // Use seed to cycle through batches of 3
    const offset = (shuffleSeed * 3) % sorted.length;
    const batch = [];
    for (let i = 0; i < 3; i++) {
      batch.push(sorted[(offset + i) % sorted.length]);
    }
    return batch;
  }, [matchingGames, shuffleSeed]);

  if (!isOpen) return null;

  const activeCategoryDef = FOCUSED_CATEGORIES.find(c => c.id === selectedCategory) || FOCUSED_CATEGORIES[0];

  const handleShuffle = () => {
    setShuffleSeed(prev => prev + 1);
  };

  const handleSaveBacklog = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    if (!user) {
      showToast(language === 'id' ? 'Masuk dengan Roblox untuk simpan backlog' : 'Sign in with Roblox to save backlog', 'info');
      return;
    }
    const isBacklog = getUserLogForGame(game.id)?.status === 'backlog';
    toggleGameStatus(game.id, 'backlog');
    showToast(
      isBacklog 
        ? (language === 'id' ? 'Dihapus dari Backlog' : 'Removed from Backlog')
        : (language === 'id' ? `"${game.name}" disimpan ke Backlog!` : `"${game.name}" added to Backlog!`),
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
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{language === 'id' ? 'Game Finder: Rekomendasi Terfokus' : 'Game Finder: Curated Recommendations'}</span>
              </h3>
              <p className="text-[11px] text-muted">
                {language === 'id' ? 'Temukan game berkualitas berdasarkan siapa yang main & mood kamu' : 'Find quality experiences by group size and exact mood'}
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

        {/* Step 1 & 2 Filter Bar */}
        <div className="space-y-4 flex-shrink-0 bg-bg p-3.5 rounded-[3px] border border-line">
          {/* Step 1: Main Sama Siapa */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green">
                {language === 'id' ? 'Langkah 1: Main Sama Siapa?' : 'Step 1: Who is Playing?'}
              </span>
            </div>
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
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-xs font-semibold transition-all cursor-pointer truncate ${
                      active
                        ? 'bg-green text-black shadow-[0_2px_8px_rgba(0,224,84,0.25)]'
                        : 'bg-panel hover:bg-panel-2 text-ink hover:text-white border border-line'
                    }`}
                  >
                    <span>{style.emoji}</span>
                    <span className="truncate">{language === 'id' ? style.labelId.split(' ')[0] : style.labelEn.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Kategori Pilihan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green">
                {language === 'id' ? 'Langkah 2: Pilih Kategori / Mood' : 'Step 2: Choose Category / Mood'}
              </span>
              <span className="text-[10px] text-faint">
                {matchingGames.length} {language === 'id' ? 'game terverifikasi' : 'verified games'}
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
                    <span>{cat.emoji}</span>
                    <span>{language === 'id' ? cat.labelId : cat.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Showcase Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {showcaseGames.length > 0 ? (
            showcaseGames.map((game, index) => {
              const isBacklog = getUserLogForGame(game.id)?.status === 'backlog';
              const totalVotes = (game.upVotes || 0) + (game.downVotes || 0);
              const likePct = totalVotes > 0 ? Math.round(((game.upVotes || 0) / totalVotes) * 100) : 90;

              return (
                <div 
                  key={game.id}
                  className="p-3.5 rounded-[3px] bg-bg border border-line hover:border-line-soft transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div 
                    onClick={() => handleViewDetail(game.id)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={safeImgSrc(game.iconUrl)}
                      alt={game.name}
                      className="w-14 h-14 rounded-[3px] object-cover border border-line flex-shrink-0 bg-black group-hover:border-green/50 transition-colors"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
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

                      <div className="flex items-center gap-3 text-[11px]">
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
                      title={isBacklog ? 'Tersimpan di Backlog' : 'Simpan ke Backlog'}
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[2px] bg-green hover:bg-[#00c94b] text-black font-bold text-xs shadow-[0_2px_8px_rgba(0,224,84,0.25)] transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'id' ? 'Main' : 'Play'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 space-y-3 bg-bg rounded-[3px] border border-line">
              <p className="text-xs text-muted">
                {language === 'id'
                  ? 'Tidak ada game yang cocok dengan kombinasi filter ini.'
                  : 'No games match this combination.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedStyle('all');
                  setSelectedCategory('all');
                }}
                className="bb-btn bb-btn-primary text-xs"
              >
                {language === 'id' ? 'Reset ke Semua Pilihan' : 'Reset All Filters'}
              </button>
            </div>
          )}
        </div>

        {/* Footer with Shuffle Option */}
        <div className="flex items-center justify-between border-t border-line pt-3 flex-shrink-0 text-xs">
          <p className="text-faint text-[11px]">
            {language === 'id' ? 'Klik Main untuk meluncurkan Roblox client secara instan.' : 'Click Play to launch Roblox client instantly.'}
          </p>

          {matchingGames.length > 3 && (
            <button
              type="button"
              onClick={handleShuffle}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-green transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Opsi Lainnya' : 'More Options'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
