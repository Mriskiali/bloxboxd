import React, { useState } from 'react';
import { Calendar, Star, Heart, Eye, MessageSquare, Plus, ArrowUpDown, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameCard } from './GameCard';
import { safeImgSrc } from '../types';

export const DiaryView: React.FC = () => {
  const { userLogs, getGameById, viewGame, openLogModal, user, setLoginModalOpen, language, t } = useApp();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const logsWithDate = userLogs
    .filter(l => l.loggedDate)
    .sort((a, b) => {
      const timeA = new Date(a.loggedDate).getTime();
      const timeB = new Date(b.loggedDate).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  // Group by Month and Year (e.g. "September 2026")
  const groupedLogs: { [key: string]: typeof logsWithDate } = {};
  logsWithDate.forEach(log => {
    const d = new Date(log.loggedDate);
    const monthYear = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
    if (!groupedLogs[monthYear]) {
      groupedLogs[monthYear] = [];
    }
    groupedLogs[monthYear].push(log);
  });

  return (
    <div className="min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
      {/* Diary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green" />
            <h1 className="bb-display text-[26px] sm:text-[30px]">
              {t('diary_title')}
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            {t('diary_desc')}
          </p>
        </div>

        {/* Sort order toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-panel border border-line text-xs font-semibold text-ink hover:text-white transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? t('diary_sort_newest') : t('diary_sort_oldest')}</span>
          </button>
        </div>
      </div>

      {/* Grouped Logs Stream */}
      {!user ? (
        <div className="border-y border-line py-16 text-center">
          <h3 className="bb-display text-[24px]">{t('diary_login_title')}</h3>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-muted">
            {t('diary_login_desc')}
          </p>
          <button onClick={() => setLoginModalOpen(true)} className="bb-btn bb-btn-primary mt-5">
            {t('diary_login_btn')}
          </button>
        </div>
      ) : Object.keys(groupedLogs).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([monthYear, logsInMonth]) => (
            <div key={monthYear} className="space-y-3">
              <div className="sticky top-16 z-10 py-1.5 bg-bg/90 ">
                <span className="bb-label">{monthYear} · {logsInMonth.length}</span>
              </div>

              <div className="bg-panel border border-line rounded-[3px] overflow-hidden divide-y divide-line">
                {logsInMonth.map(log => {
                  const game = getGameById(log.gameId);
                  if (!game) return null;

                  const dateObj = new Date(log.loggedDate);
                  const dayNum = dateObj.getDate();
                  const weekday = dateObj.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' });

                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-panel transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        {/* Day indicator */}
                        <div className="w-11 text-center flex-shrink-0 bg-bg border border-line py-1.5 rounded-[3px]">
                          <span className="block text-base font-semibold text-white leading-none">
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-bold text-muted uppercase mt-0.5 block">
                            {weekday}
                          </span>
                        </div>

                        {/* Game Icon */}
                        <img
                          src={safeImgSrc(game.iconUrl)}
                          alt={game.name}
                          onClick={() => viewGame(game.id)}
                          className="w-14 h-14 rounded-[3px] object-cover cursor-pointer flex-shrink-0 border border-white/10  transition-transform"
                        />

                        {/* Name, Genre, Review note */}
                        <div className="min-w-0">
                          <h3
                            onClick={() => viewGame(game.id)}
                            className="text-base font-bold text-white hover:text-green cursor-pointer transition-colors truncate"
                          >
                            {game.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                            <span>{game.creatorName}</span>
                            <span>•</span>
                            <span className="text-ink">{game.genre}</span>
                            {log.isLiked && (
                              <Heart className="w-3.5 h-3.5 text-orange fill-orange" />
                            )}
                          </div>

                          {log.reviewText && (
                            <p className="text-xs text-ink mt-2 italic bg-bg/70 p-2.5 rounded-[2px] border border-line max-w-2xl line-clamp-2">
                              "{log.reviewText}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Action & Rating */}
                      <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                        {log.rating ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-black/40 border border-white/10 text-green font-bold text-sm">
                            <Star className="w-4 h-4 fill-green" />
                            <span>{log.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted bg-panel-2 px-2.5 py-1 rounded">
                            {log.status}
                          </span>
                        )}

                        <button
                          onClick={() => openLogModal(game)}
                          className="text-xs font-semibold text-muted hover:text-white px-3 py-1.5 rounded-[2px] bg-panel hover:bg-panel-2 transition-colors"
                        >
                          {t('diary_edit_log')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-panel rounded-[3px] border border-line text-muted text-xs space-y-1">
          <p className="font-semibold text-ink">{t('diary_empty_title')}</p>
          <p className="text-faint">{t('diary_empty_desc')}</p>
        </div>
      )}
    </div>
  );
};
