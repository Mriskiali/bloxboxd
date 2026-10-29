import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Dices, 
  Sparkles, 
  Play, 
  Bookmark, 
  Star, 
  Users, 
  ExternalLink,
  ChevronRight,
  Check
} from 'lucide-react';
import { Game, safeImgSrc } from '../types';
import { useApp } from '../context/AppContext';
import { VIBES, VibeType, isGameMatchingVibe, launchRobloxExperience } from '../utils/vibe';

interface SurpriseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SurpriseMeModal: React.FC<SurpriseMeModalProps> = ({ isOpen, onClose }) => {
  const { games, viewGame, toggleGameStatus, getUserLogForGame, user, language, showToast } = useApp();
  const [selectedVibe, setSelectedVibe] = useState<VibeType>('all');
  const [pickedGame, setPickedGame] = useState<Game | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // Filter candidates matching vibe
  const candidateGames = useMemo(() => {
    return games.filter(g => isGameMatchingVibe(g, selectedVibe));
  }, [games, selectedVibe]);

  // Pick random game from candidates
  const pickRandom = (vibe: VibeType = selectedVibe) => {
    const list = games.filter(g => isGameMatchingVibe(g, vibe));
    if (list.length === 0) {
      setPickedGame(null);
      return;
    }

    setIsShuffling(true);
    setTimeout(() => {
      // Pick one different from current if possible
      const available = pickedGame && list.length > 1 
        ? list.filter(g => g.id !== pickedGame.id) 
        : list;
      const random = available[Math.floor(Math.random() * available.length)];
      setPickedGame(random);
      setIsShuffling(false);
    }, 180);
  };

  // Re-pick when modal opens or vibe changes
  useEffect(() => {
    if (isOpen) {
      pickRandom(selectedVibe);
    }
  }, [isOpen, selectedVibe]);

  if (!isOpen) return null;

  const activeVibeDef = VIBES.find(v => v.id === selectedVibe) || VIBES[0];
  const userLog = pickedGame ? getUserLogForGame(pickedGame.id) : undefined;
  const isBacklog = userLog?.status === 'backlog';

  const handleSaveBacklog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pickedGame) return;
    if (!user) {
      showToast(language === 'id' ? 'Masuk dengan Roblox untuk simpan backlog' : 'Sign in with Roblox to save backlog', 'info');
      return;
    }
    toggleGameStatus(pickedGame.id, 'backlog');
    showToast(
      isBacklog 
        ? (language === 'id' ? 'Dihapus dari Backlog' : 'Removed from Backlog')
        : (language === 'id' ? `"${pickedGame.name}" disimpan ke Backlog!` : `"${pickedGame.name}" added to Backlog!`),
      'success'
    );
  };

  const handlePlayNow = () => {
    if (!pickedGame) return;
    launchRobloxExperience(pickedGame.rootPlaceId);
  };

  const handleViewDetail = () => {
    if (!pickedGame) return;
    viewGame(pickedGame.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-xl rounded-[3px] bg-panel border border-line p-6 shadow-[0_20px_48px_rgba(0,0,0,0.7)] space-y-5 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[3px] bg-green/15 text-green border border-green/25">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{language === 'id' ? 'Bingung Mau Main Apa?' : 'Not Sure What to Play?'}</span>
              </h3>
              <p className="text-[11px] text-muted">
                {language === 'id' ? 'Rekomendasi game Roblox terkurasi sesuai mood kamu' : 'Curated Roblox recommendations tailored to your vibe'}
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

        {/* Vibe Selector Pills */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
            {language === 'id' ? 'Pilih Suasana / Mood' : 'Choose Your Vibe'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VIBES.map(vibe => {
              const active = selectedVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => setSelectedVibe(vibe.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-green text-black shadow-[0_2px_8px_rgba(0,224,84,0.3)]'
                      : 'bg-bg text-ink hover:text-white hover:bg-panel-2 border border-line'
                  }`}
                >
                  <span>{vibe.emoji}</span>
                  <span>{language === 'id' ? vibe.labelId : vibe.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Picked Game Card Display */}
        {pickedGame ? (
          <div className={`p-4 rounded-[3px] bg-bg border border-line space-y-4 transition-all duration-150 ${
            isShuffling ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'
          }`}>
            <div className="flex gap-4 items-start">
              <img
                src={safeImgSrc(pickedGame.iconUrl)}
                alt={pickedGame.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[3px] object-cover border border-line flex-shrink-0 bg-black"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[2px] bg-green/10 border border-green/20 text-green uppercase tracking-wider">
                    {language === 'id' ? activeVibeDef.badgeId : activeVibeDef.badgeEn}
                  </span>
                  <span className="text-[11px] text-faint">
                    {pickedGame.genre}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white line-clamp-1">
                  {pickedGame.name}
                </h4>

                <p className="text-xs text-muted">
                  {language === 'id' ? 'Oleh' : 'By'} <strong className="text-white font-medium">{pickedGame.creatorName}</strong>
                </p>

                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="flex items-center gap-1 text-orange font-bold">
                    <Star className="w-3.5 h-3.5 fill-orange" />
                    <span>{pickedGame.ratingAverage.toFixed(1)}</span>
                  </span>
                  {pickedGame.playerCount !== undefined && pickedGame.playerCount > 0 && (
                    <span className="flex items-center gap-1 text-muted">
                      <Users className="w-3.5 h-3.5" />
                      <span>{pickedGame.playerCount.toLocaleString()} online</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {pickedGame.description && (
              <p className="text-xs text-ink leading-relaxed line-clamp-2 pt-1 border-t border-line/60">
                {pickedGame.description}
              </p>
            )}

            {/* Quick Action CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={handlePlayNow}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[3px] bg-green hover:bg-[#00c94b] text-black font-bold text-xs shadow-[0_2px_10px_rgba(0,224,84,0.3)] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{language === 'id' ? 'Mainkan di Roblox' : 'Play on Roblox'}</span>
              </button>

              <button
                type="button"
                onClick={() => pickRandom()}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[3px] bg-panel-2 hover:bg-panel border border-line text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Dices className={`w-4 h-4 text-green ${isShuffling ? 'animate-spin' : ''}`} />
                <span>{language === 'id' ? 'Acak Game Lain' : 'Pick Another'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-muted">
              <button
                type="button"
                onClick={handleSaveBacklog}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isBacklog ? 'text-green font-semibold' : 'hover:text-white'
                }`}
              >
                {isBacklog ? <Check className="w-3.5 h-3.5 text-green" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isBacklog ? (language === 'id' ? 'Tersimpan di Backlog' : 'Saved in Backlog') : (language === 'id' ? 'Simpan ke Backlog' : 'Save to Backlog')}</span>
              </button>

              <button
                type="button"
                onClick={handleViewDetail}
                className="flex items-center gap-1 text-ink hover:text-white font-medium transition-colors cursor-pointer"
              >
                <span>{language === 'id' ? 'Detail & Ulasan' : 'Details & Reviews'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <p className="text-xs text-muted">
              {language === 'id' ? 'Tidak ada game yang cocok dengan suasana ini.' : 'No experiences matching this vibe.'}
            </p>
            <button
              type="button"
              onClick={() => setSelectedVibe('all')}
              className="bb-btn bb-btn-primary text-xs"
            >
              {language === 'id' ? 'Tampilkan Semua Suasana' : 'Show All Vibes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
