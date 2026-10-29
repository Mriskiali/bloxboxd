import React, { useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  Flame, 
  Star, 
  Users, 
  Calendar, 
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SortOption } from '../types';

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  variant?: 'popover' | 'modal';
}

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply,
  variant = 'popover'
}) => {
  const {
    games,
    sortBy,
    setSortBy,
    minRating,
    setMinRating,
    minPlayers,
    setMinPlayers,
    resetAllFilters,
    setActiveTab,
    language,
    t
  } = useApp();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeFiltersCount = 
    (sortBy !== 'popular' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minPlayers > 0 ? 1 : 0);

  // Calculate live matching count based on current filter selections
  const matchingCount = games.filter(g => {
    if (minRating > 0 && (g.ratingAverage || 0) < minRating) return false;
    if (minPlayers > 0 && (g.playerCount || 0) < minPlayers) return false;
    return true;
  }).length;

  const sortOptions: { id: SortOption; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'popular', 
      label: t('sort_popular'), 
      icon: <Flame className="w-3.5 h-3.5 text-[#FF8000]" /> 
    },
    { 
      id: 'rating', 
      label: t('sort_rating'), 
      icon: <Star className="w-3.5 h-3.5 text-green fill-green" /> 
    },
    { 
      id: 'visits', 
      label: t('sort_visits'), 
      icon: <Users className="w-3.5 h-3.5 text-blue" /> 
    },
    { 
      id: 'newest', 
      label: t('sort_newest'), 
      icon: <Calendar className="w-3.5 h-3.5 text-blue" /> 
    },
    { 
      id: 'az', 
      label: t('sort_az'), 
      icon: <ArrowUpDown className="w-3.5 h-3.5 text-muted" /> 
    },
  ];

  const ratingOptions = [
    { value: 0, label: t('filter_modal_all') },
    { value: 3.5, label: '3.5+ ★' },
    { value: 4.0, label: '4.0+ ★' },
    { value: 4.5, label: '4.5+ ★' },
  ];

  const playerOptions = [
    { value: 0, label: t('filter_modal_any') },
    { value: 1000, label: '1K+' },
    { value: 10000, label: '10K+' },
    { value: 50000, label: '50K+' },
  ];

  const handleApply = () => {
    setActiveTab('catalog');
    if (onApply) onApply();
    onClose();
  };

  // Reusable filter content inside either the anchored Popover or safe Modal
  const content = (
    <div 
      className="w-full bg-panel border border-line rounded-[3px] shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[640px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-line bg-bg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-[2px] bg-green/10 border border-green/25">
            <SlidersHorizontal className="w-4 h-4 text-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('filter_modal_title')}
              </h3>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green text-black">
                  {t('filter_modal_active', { count: activeFiltersCount })}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted">
              {t('filter_modal_desc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-semibold text-ink hover:text-white hover:bg-panel-2 border border-line transition-colors"
              title={language === 'id' ? 'Reset semua filter ke default' : 'Reset all filters to default'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('filter_modal_reset')}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-muted hover:text-white hover:bg-panel-2 transition-colors"
            aria-label={language === 'id' ? 'Tutup filter' : 'Close filters'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
        {/* 1. Urutkan Berdasarkan (Sort By) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {t('filter_modal_sort_label')}
            </label>
            <span className="text-[11px] text-green font-semibold">
              {sortOptions.find(s => s.id === sortBy)?.label}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {sortOptions.map((opt) => {
              const isActive = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[3px] text-left border transition-colors ${
                    isActive
                      ? 'bg-green/15 border-green text-white shadow-sm'
                      : 'bg-panel border-line text-ink hover:border-line hover:bg-panel-2'
                  }`}
                >
                  <span className="flex-shrink-0">{opt.icon}</span>
                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-green font-bold' : 'text-ink'}`}>
                    {opt.label}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-green ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Dua Kolom: Rating & Pemain Online */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Minimum Rating */}
          <div className="space-y-2 bg-panel/60 p-3 rounded-[3px] border border-line">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                {t('filter_min_rating_label')}
              </label>
              {minRating > 0 && (
                <span className="text-[10px] text-green font-bold">{minRating}+ ★</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {ratingOptions.map((opt) => {
                const isActive = minRating === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMinRating(opt.value)}
                    className={`py-1.5 px-1 rounded-[2px] text-xs font-bold border text-center transition-colors ${
                      isActive
                        ? 'bg-green/15 border-green text-green'
                        : 'bg-panel border-line text-ink hover:border-line'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum Pemain Online */}
          <div className="space-y-2 bg-panel/60 p-3 rounded-[3px] border border-line">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                {t('filter_min_players_label')}
              </label>
              {minPlayers > 0 && (
                <span className="text-[10px] text-blue font-bold">{minPlayers.toLocaleString()}+</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {playerOptions.map((opt) => {
                const isActive = minPlayers === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMinPlayers(opt.value)}
                    className={`py-1.5 px-1 rounded-[2px] text-xs font-bold border text-center transition-colors ${
                      isActive
                        ? 'bg-blue/15 border-blue text-blue'
                        : 'bg-panel border-line text-ink hover:border-line'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 border-t border-line bg-bg flex items-center justify-between gap-3">
        <div className="text-xs text-muted">
          <span>
            {t('filter_modal_matching', { count: matchingCount })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[3px] text-xs font-semibold text-ink hover:text-white hover:bg-panel-2 border border-line transition-colors"
          >
            {t('filter_modal_close')}
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 rounded-[3px] text-xs font-semibold bg-green hover:bg-[#00c94b] text-black transition-colors active:scale-95 flex items-center gap-1.5"
          >
            <span>{t('filter_modal_apply')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // If popover variant: rendered as a floating panel attached directly under the search bar
  if (variant === 'popover') {
    return (
      <div className="absolute right-0 top-full mt-2 w-[440px] sm:w-[540px] max-w-[calc(100vw-24px)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
        {content}
      </div>
    );
  }

  // If modal variant (mobile screens or full fallback): safely padded so top is never cut off
  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-3 sm:p-4 pt-14 sm:pt-20 pb-8 bg-black/75  animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="w-full max-w-lg">
        {content}
      </div>
    </div>
  );
};
