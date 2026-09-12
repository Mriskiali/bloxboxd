import React, { useState } from 'react';
import { Calendar, Star, Heart, Eye, MessageSquare, Plus, ArrowUpDown, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameCard } from './GameCard';
import { safeImgSrc } from '../types';

export const DiaryView: React.FC = () => {
  const { userLogs, getGameById, viewGame, openLogModal, user, setLoginModalOpen } = useApp();
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
    const monthYear = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedLogs[monthYear]) {
      groupedLogs[monthYear] = [];
    }
    groupedLogs[monthYear].push(log);
  });

  return (
    <div className="min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
      {/* Diary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252f3b] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00E59B]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Roblox Play Diary
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            A chronological timeline of every experience you played, rated, and logged
          </p>
        </div>

        {/* Sort order toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2128] border border-[#27323e] text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Grouped Logs Stream */}
      {!user ? (
        <div className="text-center py-16 px-4 bg-[#181e24] rounded-2xl border border-[#252f3b] space-y-4">
          <Calendar className="w-12 h-12 text-[#00E59B] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Masuk Akun untuk Membuat Diary</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Hubungkan akun Roblox kamu untuk mencatat riwayat bermain, tanggal bermain, serta review pribadi.
            </p>
          </div>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-6 py-2.5 bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs rounded-xl transition-all shadow-md"
          >
            Masuk Roblox
          </button>
        </div>
      ) : Object.keys(groupedLogs).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([monthYear, logsInMonth]) => (
            <div key={monthYear} className="space-y-3">
              <div className="sticky top-16 z-10 py-1.5 bg-[#14181c]/90 backdrop-blur-md">
                <span className="text-xs font-black text-[#00E59B] uppercase tracking-widest bg-[#1a222a] border border-[#283442] px-3 py-1 rounded-full">
                  {monthYear} ({logsInMonth.length})
                </span>
              </div>

              <div className="bg-[#181e24] border border-[#252f3b] rounded-2xl overflow-hidden divide-y divide-[#232b35] shadow-lg">
                {logsInMonth.map(log => {
                  const game = getGameById(log.gameId);
                  if (!game) return null;

                  const dateObj = new Date(log.loggedDate);
                  const dayNum = dateObj.getDate();
                  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1d252e] transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        {/* Day indicator */}
                        <div className="w-11 text-center flex-shrink-0 bg-[#14181c] border border-[#26313d] py-1.5 rounded-xl">
                          <span className="block text-base font-black text-white leading-none">
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 block">
                            {weekday}
                          </span>
                        </div>

                        {/* Game Icon */}
                        <img
                          src={safeImgSrc(game.iconUrl)}
                          alt={game.name}
                          onClick={() => viewGame(game.id)}
                          className="w-14 h-14 rounded-xl object-cover cursor-pointer flex-shrink-0 border border-white/10 hover:scale-105 transition-transform"
                        />

                        {/* Name, Genre, Review note */}
                        <div className="min-w-0">
                          <h3
                            onClick={() => viewGame(game.id)}
                            className="text-base font-bold text-white hover:text-[#00E59B] cursor-pointer transition-colors truncate"
                          >
                            {game.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{game.creatorName}</span>
                            <span>•</span>
                            <span className="text-gray-300">{game.genre}</span>
                            {log.isLiked && (
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            )}
                          </div>

                          {log.reviewText && (
                            <p className="text-xs text-gray-300 mt-2 italic bg-[#14181c]/70 p-2.5 rounded-lg border border-[#242d38] max-w-2xl line-clamp-2">
                              "{log.reviewText}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Action & Rating */}
                      <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                        {log.rating ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[#00E59B] font-bold text-sm">
                            <Star className="w-4 h-4 fill-[#00E59B]" />
                            <span>{log.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400 bg-[#212933] px-2.5 py-1 rounded">
                            {log.status}
                          </span>
                        )}

                        <button
                          onClick={() => openLogModal(game)}
                          className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-[#222a33] hover:bg-[#2b3541] transition-colors"
                        >
                          Edit
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
        <div className="text-center py-20 bg-[#181e24] rounded-2xl border border-[#252f3b] text-gray-400 text-xs">
          Your diary is empty. Log a game with a date to build your diary!
        </div>
      )}
    </div>
  );
};
