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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-lg rounded-2xl bg-[#181e24] border border-[#2b3542] shadow-2xl overflow-hidden my-8"
      >
        {/* Header with Game Banner */}
        <div className="relative p-5 pb-4 bg-[#14181c] border-b border-[#242d38] flex items-start gap-3.5">
          <img 
            src={safeImgSrc(logModalGame.iconUrl)} 
            alt={logModalGame.name}
            className="w-16 h-16 rounded-xl object-cover bg-black flex-shrink-0 shadow-md border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E59B]">
              {t('log_modal_title')}
            </span>
            <h3 className="text-lg font-bold text-white truncate">
              {logModalGame.name}
            </h3>
            <p className="text-xs text-gray-400">
              {logModalGame.creatorName} • {logModalGame.releaseYear || 'Roblox'}
            </p>
          </div>
          <button
            onClick={closeLogModal}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#222a33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Tracking Shelf Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
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
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-[#00E59B] bg-[#00E59B]/15 text-[#00E59B] shadow-[0_0_12px_rgba(0,229,155,0.2)]'
                        : 'border-[#29333f] bg-[#1d242c] text-gray-400 hover:text-white hover:bg-[#232c35]'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1 border-t border-[#232b35]">
            {/* Played Date Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{t('log_modal_date')}</span>
              </label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00E59B] outline-none"
              />
            </div>

            {/* Star Rating & Like */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  {t('log_modal_rating')}
                </label>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-[10px] text-gray-400 hover:text-rose-400 transition-colors"
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
                  className={`p-1.5 rounded-lg border transition-all ${
                    isLiked 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-500' 
                      : 'border-[#29333f] bg-[#1d242c] text-gray-400 hover:text-rose-400'
                  }`}
                  title={t('log_modal_like')}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Review Text */}
          <div className="pt-1 border-t border-[#232b35]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                {language === 'id' ? 'Ulasan & Catatan (Mendukung Markdown)' : 'Review & Thoughts (Markdown supported)'}
              </label>
              <span className="text-[11px] text-gray-400">
                {language === 'id' ? 'Opsional' : 'Optional'}
              </span>
            </div>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t('log_modal_review_ph')}
              className="w-full bg-[#1b222a] border border-[#2b3542] rounded-xl p-3 text-xs text-white focus:border-[#00E59B] outline-none resize-y leading-relaxed"
            />
          </div>

          {/* Toggles: Contains Spoilers & Top 4 Favorite */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[#151a20] p-3 rounded-xl border border-[#222b36]">
            {/* Contains Spoilers */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSpoilers}
                onChange={(e) => setHasSpoilers(e.target.checked)}
                className="w-4 h-4 rounded text-[#00E59B] accent-[#00E59B] bg-[#1d242c] border-[#2c3744]"
              />
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {t('log_modal_spoilers')}
              </span>
            </label>

            {/* Favorite 4 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded text-[#00E59B] accent-[#00E59B] bg-[#1d242c] border-[#2c3744]"
              />
              <span className="text-xs text-[#00E59B] font-semibold">
                {t('log_modal_fav')}
              </span>
            </label>
          </div>

          {/* Actions: Save, Cancel, Delete */}
          <div className="flex items-center justify-between pt-3 border-t border-[#232b35]">
            {existingLog ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('log_modal_delete')}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeLogModal}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-[#202731] transition-colors"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-black bg-[#00E59B] hover:bg-[#00c988] rounded-lg transition-all shadow-[0_0_16px_rgba(0,229,155,0.4)]"
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
