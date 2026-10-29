import React, { useState, useEffect } from 'react';
import { X, Calendar, Heart, AlertCircle, Trash2, Eye, Bookmark, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShelfStatus, safeImgSrc } from '../types';
import { RatingStars } from './RatingStars';

export const LogModal: React.FC = () => {
  const { 
    logModalOpen, 
    logModalGame, 
    closeLogModal, 
    getUserLogForGame, 
    saveGameLog, 
    deleteGameLog,
    user,
    language,
    t
  } = useApp();

  const existingLog = logModalGame ? getUserLogForGame(logModalGame.id) : undefined;

  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [hasSpoilers, setHasSpoilers] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [status, setStatus] = useState<ShelfStatus>('played');
  const [loggedDate, setLoggedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    if (!logModalOpen || !logModalGame) return;
    if (existingLog) {
      setRating(existingLog.rating || 0);
      setReviewText(existingLog.reviewText || '');
      setHasSpoilers(existingLog.hasSpoilers || false);
      setIsLiked(existingLog.isLiked || false);
      setStatus(existingLog.status || 'played');
      setLoggedDate(existingLog.loggedDate || new Date().toISOString().split('T')[0]);
      setIsFavorite(existingLog.isFavorite || (user?.favoriteGameIds?.includes(logModalGame.id) ?? false));
    } else {
      setRating(0);
      setReviewText('');
      setHasSpoilers(false);
      setIsLiked(false);
      setStatus('played');
      setLoggedDate(new Date().toISOString().split('T')[0]);
      setIsFavorite(user?.favoriteGameIds?.includes(logModalGame.id) ?? false);
    }
  }, [existingLog, logModalGame, logModalOpen, user?.favoriteGameIds]);

  if (!logModalOpen || !logModalGame) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGameLog({
      gameId: logModalGame.id,
      status,
      rating: rating > 0 ? rating : undefined,
      reviewText: reviewText.trim() ? reviewText.trim() : undefined,
      hasSpoilers,
      isLiked,
      isFavorite,
      loggedDate
    });
    closeLogModal();
  };

  const handleDelete = () => {
    if (existingLog) {
      deleteGameLog(existingLog.id);
      closeLogModal();
    }
  };

  const shelfOptions: { id: ShelfStatus; label: string; desc: string; icon: any }[] = [
    { id: 'played', label: t('log_modal_played'), desc: language === 'id' ? 'Selesai / Pernah main' : 'Finished or experienced', icon: Eye },
    { id: 'playing', label: t('log_modal_playing'), desc: language === 'id' ? 'Sedang aktif main' : 'Currently active', icon: Sparkles },
    { id: 'backlog', label: t('log_modal_backlog'), desc: language === 'id' ? 'Simpan untuk nanti' : 'Save for later', icon: Bookmark },
    { id: 'dropped', label: language === 'id' ? 'Batal' : 'Dropped', desc: language === 'id' ? 'Berhenti main' : 'Stopped playing', icon: X }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75  overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-lg rounded-[3px] bg-panel border border-line shadow-[0_8px_24px_rgba(0,0,0,0.55)] overflow-hidden my-8"
      >
        {/* Header with Game Banner */}
        <div className="relative p-5 pb-4 bg-bg border-b border-line flex items-start gap-3.5">
          <img 
            src={safeImgSrc(logModalGame.iconUrl)} 
            alt={logModalGame.name}
            className="w-16 h-16 rounded-[3px] object-cover bg-black flex-shrink-0 border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <span className="bb-label block">{t('log_modal_title')}</span>
            <h3 className="truncate text-[15px] font-semibold text-white">
              {logModalGame.name}
            </h3>
            <p className="text-xs text-muted">
              {logModalGame.creatorName} • {logModalGame.releaseYear || 'Roblox'}
            </p>
          </div>
          <button
            onClick={closeLogModal}
            className="text-muted hover:text-white p-1.5 rounded-[2px] hover:bg-panel transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Tracking Shelf Status */}
          <div>
            <label className="bb-label mb-2 block">
              {t('log_modal_shelf')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {shelfOptions.map((opt) => {
                const isSelected = status === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-[3px] border text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'border-green bg-green/10 text-green'
                        : 'border-line bg-panel text-muted hover:text-white hover:bg-panel-2'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Rating Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1 border-t border-line">
            {/* Played Date Picker */}
            <div>
              <label className="bb-label mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted" />
                <span>{t('log_modal_date')}</span>
              </label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="bb-input text-[13px]"
              />
            </div>

            {/* Star Rating & Like */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="bb-label">
                  {t('log_modal_rating')}
                </label>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-[10px] text-muted hover:text-orange transition-colors"
                  >
                    {language === 'id' ? 'Hapus' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <RatingStars
                  value={rating}
                  onChange={(val) => setRating(val)}
                  size="md"
                  showText
                />
                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-1.5 rounded-[2px] border transition-colors ${
                    isLiked 
                      ? 'bg-orange/20 border-orange text-orange' 
                      : 'border-line bg-panel text-muted hover:text-orange'
                  }`}
                  title={t('log_modal_like')}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-orange' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Review Text */}
          <div className="pt-1 border-t border-line">
            <div className="flex items-center justify-between mb-1.5">
              <label className="bb-label">
                {language === 'id' ? 'Ulasan & Catatan (Mendukung Markdown)' : 'Review & Thoughts (Markdown supported)'}
              </label>
              <span className="text-[11px] text-muted">
                {language === 'id' ? 'Opsional' : 'Optional'}
              </span>
            </div>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t('log_modal_review_ph')}
              className="w-full resize-y rounded-[3px] border border-line-strong bg-panel-2 p-3 text-[13px] leading-relaxed text-ink outline-none focus:border-green"
            />
          </div>

          {/* Toggles: Contains Spoilers & Top 4 Favorite */}
          <div className="flex flex-col items-start justify-between gap-3 border-y border-line py-3 sm:flex-row sm:items-center">
            {/* Contains Spoilers */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSpoilers}
                onChange={(e) => setHasSpoilers(e.target.checked)}
                className="h-3.5 w-3.5 accent-green"
              />
              <span className="text-xs text-ink font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-blue" />
                {t('log_modal_spoilers')}
              </span>
            </label>

            {/* Favorite 4 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-3.5 w-3.5 accent-green"
              />
              <span className="text-[12px] text-ink">
                {t('log_modal_fav')}
              </span>
            </label>
          </div>

          {/* Actions: Save, Cancel, Delete */}
          <div className="flex items-center justify-between pt-3 border-t border-line">
            {existingLog ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-1 text-[12px] text-muted transition-colors hover:text-orange"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('log_modal_delete')}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeLogModal}
                className="bb-btn bb-btn-ghost"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="bb-btn bb-btn-primary"
              >
                <Check className="w-4 h-4" />
                <span>{t('log_modal_save')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
