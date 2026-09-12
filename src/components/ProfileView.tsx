import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Eye, 
  Bookmark, 
  MessageSquare, 
  Calendar, 
  Star, 
  Heart, 
  ExternalLink, 
  Filter,
  Plus,
  Play,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameCard } from './GameCard';
import { RatingStars } from './RatingStars';
import { ShelfStatus, safeImgSrc, safeAvatarSrc } from '../types';

export const ProfileView: React.FC = () => {
  const { 
    user, 
    userLogs, 
    reviews, 
    games, 
    getGameById, 
    viewGame, 
    openLogModal, 
    activeProfileTab, 
    setActiveProfileTab,
    setEditProfileModalOpen,
    setLoginModalOpen
  } = useApp();

  const [shelfFilter, setShelfFilter] = useState<'all' | ShelfStatus | 'favorites'>('all');
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });

  React.useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/users/${encodeURIComponent(user.id)}/follow-status`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setFollowStats({
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0
          });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen pb-20 pt-10 px-4">
        <div className="max-w-2xl mx-auto bg-[#181e24] border border-[#2b3745] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#00E59B]/10 border border-[#00E59B]/30 flex items-center justify-center shadow-inner">
            <span className="w-8 h-8 bg-[#00E59B] transform -rotate-12 rounded-[5px] shadow-[0_0_15px_rgba(0,229,155,0.7)]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Masuk dengan Akun Roblox Kamu
            </h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              Hubungkan akun Roblox aslimu untuk melacak game yang kamu mainkan, mencatat diary & rating, serta memajang 4 game favorit di profilmu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="bg-[#12161b] p-4 rounded-2xl border border-[#242e3a] space-y-1">
              <span className="text-xs font-black text-[#00E59B]">01. Profil Asli</span>
              <p className="text-xs text-gray-300">Avatar 3D, teman & info resmi otomatis sinkron dari Roblox.</p>
            </div>
            <div className="bg-[#12161b] p-4 rounded-2xl border border-[#242e3a] space-y-1">
              <span className="text-xs font-black text-[#00E59B]">02. 100% Aman</span>
              <p className="text-xs text-gray-300">Dilindungi PIN Keamanan & sesi verifikasi langsung tanpa risiko.</p>
            </div>
            <div className="bg-[#12161b] p-4 rounded-2xl border border-[#242e3a] space-y-1">
              <span className="text-xs font-black text-[#00E59B]">03. Diary Game</span>
              <p className="text-xs text-gray-300">Catat setiap momen dan temukan game seru dari pemain lain.</p>
            </div>
          </div>

          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-8 py-3.5 bg-[#00E59B] hover:bg-[#00c988] text-black font-black text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Masuk Akun Roblox Sekarang
          </button>
        </div>
      </div>
    );
  }

  // Stats
  const playedCount = userLogs.filter(l => l.status === 'played').length;
  const playingCount = userLogs.filter(l => l.status === 'playing').length;
  const backlogCount = userLogs.filter(l => l.status === 'backlog').length;
  const userReviews = reviews.filter(r => r.userId === user.id);
  const diaryLogs = [...userLogs].filter(l => l.loggedDate).sort((a, b) => 
    new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime()
  );

  // Favorite 4 games
  const favoriteGames = (user.favoriteGameIds || [])
    .map(id => getGameById(id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  // Filtered games on the "Games" shelf tab
  const filteredShelfLogs = userLogs.filter(log => {
    if (shelfFilter === 'all') return true;
    if (shelfFilter === 'favorites') return log.isFavorite || (user.favoriteGameIds || []).includes(log.gameId);
    return log.status === shelfFilter;
  });

  // Dynamic genre statistics from actual user logs
  const genreCounts: Record<string, number> = {};
  let totalRatingSum = 0;
  let ratedCount = 0;

  userLogs.forEach(l => {
    const game = getGameById(l.gameId);
    if (game?.genre) {
      genreCounts[game.genre] = (genreCounts[game.genre] || 0) + 1;
    }
    if (l.rating) {
      totalRatingSum += l.rating;
      ratedCount += 1;
    }
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const totalGenreLogs = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  const avgRatingGiven = ratedCount > 0 ? (totalRatingSum / ratedCount).toFixed(1) : '—';

  return (
    <div className="min-h-screen pb-20">
      {/* Profile Header Canvas */}
      <div className="bg-[#181e24] border-b border-[#252f3b] pt-8 pb-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* User Info Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={safeAvatarSrc(user.avatarUrl)}
                  alt={user.username}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-black border-2 border-[#00E59B] shadow-xl ring-4 ring-black/40"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#00E59B] text-black text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                  PRO
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {user.username}
                  </h1>
                  <span className="text-xs font-mono text-gray-400 bg-[#212933] px-2.5 py-0.5 rounded-full border border-[#2e3947]">
                    @{user.handle}
                  </span>
                  {user.isRobloxVerified ? (
                    <span className="text-[10px] font-bold text-[#00E59B] bg-[#00E59B]/10 px-2 py-0.5 rounded border border-[#00E59B]/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E59B] animate-pulse" />
                      Roblox Verified Owner
                    </span>
                  ) : user.robloxUserId ? (
                    <span className="text-[10px] font-bold text-[#00A2FF] bg-[#00A2FF]/10 px-2 py-0.5 rounded border border-[#00A2FF]/30">
                      Akun Roblox Terhubung
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Roblox: <strong className="text-white font-medium">@{user.robloxUsername}</strong></span>
                  {user.robloxUserId && (
                    <>
                      <span>•</span>
                      <a 
                        href={`https://www.roblox.com/users/${user.robloxUserId}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00E59B] hover:underline flex items-center gap-1"
                      >
                        <span>ID: {user.robloxUserId}</span>
                      </a>
                    </>
                  )}
                  {user.robloxFriendsCount !== undefined && (
                    <>
                      <span>•</span>
                      <span>{user.robloxFriendsCount} Teman</span>
                    </>
                  )}
                  <span>• {user.joinedDate}</span>
                </p>

                <p className="text-xs text-gray-300 max-w-xl mt-2 leading-relaxed">
                  {user.bio}
                </p>

                <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold mt-2.5">
                  <span className="flex items-center gap-1.5 bg-[#171f28] px-3 py-1 rounded-xl border border-[#273444]">
                    <strong className="text-white font-bold">{followStats.followersCount}</strong>
                    <span className="text-gray-400">Pengikut</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#171f28] px-3 py-1 rounded-xl border border-[#273444]">
                    <strong className="text-white font-bold">{followStats.followingCount}</strong>
                    <span className="text-gray-400">Mengikuti</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Roblox Login & Edit Profile */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              <button
                onClick={() => setLoginModalOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  user.robloxUserId
                    ? 'bg-[#18212b] hover:bg-[#202c3a] border border-[#2b3a4a] text-gray-200 hover:text-white'
                    : 'bg-[#00A2FF] hover:bg-[#0091e6] text-white shadow-md'
                }`}
              >
                {/* Roblox tilted square icon */}
                <span className="w-2.5 h-2.5 bg-white transform -rotate-12 rounded-[2px]" />
                <span>{user.robloxUserId ? 'Ganti Akun Roblox' : 'Login Akun Roblox'}</span>
              </button>

              <button
                onClick={() => setEditProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222a33] hover:bg-[#2b3541] border border-[#313c4a] text-xs font-bold text-gray-200 hover:text-white transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-[#00E59B]" />
                <span>Edit Profile & 4 Favs</span>
              </button>
            </div>
          </div>

          {/* Stats Bar Counters (PRD Section 3.4) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#232b35]">
            <div 
              onClick={() => { setActiveProfileTab('games'); setShelfFilter('played'); }}
              className="bg-[#14181c] border border-[#242d38] rounded-xl p-3 text-center cursor-pointer hover:border-[#00E59B]/50 transition-colors"
            >
              <span className="text-2xl font-black text-white">{playedCount}</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                Experiences Played
              </span>
            </div>

            <div 
              onClick={() => setActiveProfileTab('reviews')}
              className="bg-[#14181c] border border-[#242d38] rounded-xl p-3 text-center cursor-pointer hover:border-[#00E59B]/50 transition-colors"
            >
              <span className="text-2xl font-black text-[#00E59B]">{userReviews.length}</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                Reviews Written
              </span>
            </div>

            <div 
              onClick={() => { setActiveProfileTab('backlog'); }}
              className="bg-[#14181c] border border-[#242d38] rounded-xl p-3 text-center cursor-pointer hover:border-amber-400/50 transition-colors"
            >
              <span className="text-2xl font-black text-amber-400">{backlogCount}</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                Backlog (Want to Play)
              </span>
            </div>

            <div 
              onClick={() => setActiveProfileTab('diary')}
              className="bg-[#14181c] border border-[#242d38] rounded-xl p-3 text-center cursor-pointer hover:border-[#00A2FF]/50 transition-colors"
            >
              <span className="text-2xl font-black text-[#00A2FF]">{diaryLogs.length}</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
                Diary Logs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs (PRD Section 3.4) */}
      <div className="bg-[#14181c] border-b border-[#232b35] sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar smooth-touch-scroll">
          <button
            onClick={() => setActiveProfileTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeProfileTab === 'overview'
                ? 'bg-[#00E59B] text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#1e252d]'
            }`}
          >
            Profile Overview
          </button>

          <button
            onClick={() => setActiveProfileTab('diary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'diary'
                ? 'bg-[#00E59B] text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#1e252d]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Diary ({diaryLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('games')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'games'
                ? 'bg-[#00E59B] text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#1e252d]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Shelf Collection ({userLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('reviews')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'reviews'
                ? 'bg-[#00E59B] text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#1e252d]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reviews ({userReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('backlog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'backlog'
                ? 'bg-[#00E59B] text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#1e252d]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Backlog ({backlogCount})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* TAB 1: OVERVIEW */}
        {activeProfileTab === 'overview' && (
          <div className="space-y-10">
            {/* The Signature 4 Favorites (PRD Section 3.4 & 6.2 #3) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#00E59B]" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    Favorite Roblox Experiences (The 4 Favs)
                  </h2>
                </div>
                <button
                  onClick={() => setEditProfileModalOpen(true)}
                  className="text-xs text-[#00E59B] hover:underline font-semibold"
                >
                  Change Favorites
                </button>
              </div>

              {/* 4 Poster Grid ala Letterboxd */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((slotIndex) => {
                  const game = favoriteGames[slotIndex];
                  if (game) {
                    return (
                      <div 
                        key={game.id} 
                        onClick={() => viewGame(game.id)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-[#181e24] border-2 border-[#2b3542] hover:border-[#00E59B] cursor-pointer transition-all duration-300 shadow-xl"
                      >
                        <img
                          src={safeImgSrc(game.iconUrl)}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-[10px] font-bold text-[#00E59B] uppercase tracking-wider">
                            #{slotIndex + 1} Favorite
                          </span>
                          <h4 className="text-xs font-bold text-white truncate">
                            {game.name}
                          </h4>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`empty-${slotIndex}`}
                      onClick={() => setEditProfileModalOpen(true)}
                      className="aspect-square rounded-2xl border-2 border-dashed border-[#29333f] hover:border-[#00E59B] bg-[#161b21]/50 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group"
                    >
                      <Plus className="w-6 h-6 text-gray-500 group-hover:text-[#00E59B] transition-colors mb-2" />
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-white">
                        Add Favorite #{slotIndex + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity Stream & Recent Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent Logs Activity */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-[#252f3b] pb-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00A2FF]" />
                    <span>Recent Activity</span>
                  </h3>
                  <button
                    onClick={() => setActiveProfileTab('diary')}
                    className="text-xs text-[#00A2FF] hover:underline"
                  >
                    View All Diary →
                  </button>
                </div>

                <div className="space-y-3">
                  {diaryLogs.slice(0, 5).map((log) => {
                    const game = getGameById(log.gameId);
                    if (!game) return null;

                    return (
                      <div
                        key={log.id}
                        onClick={() => viewGame(game.id)}
                        className="p-3.5 rounded-xl bg-[#181e24] border border-[#26313d] hover:border-[#00E59B]/50 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={safeImgSrc(game.iconUrl)}
                            alt={game.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#00E59B] transition-colors truncate">
                              {game.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              <span>Played on {log.loggedDate}</span>
                              {log.isLiked && <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />}
                            </div>
                          </div>
                        </div>

                        {log.rating ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-[#00E59B] bg-black/40 px-2.5 py-1 rounded-md">
                            <Star className="w-3.5 h-3.5 fill-[#00E59B]" />
                            <span>{log.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400 bg-[#212933] px-2 py-0.5 rounded">
                            {log.status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profile Bio & Quick Genres Breakdown */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border-b border-[#252f3b] pb-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00E59B]" />
                    <span>Curator Insights</span>
                  </h3>
                </div>

                <div className="bg-[#181e24] border border-[#26313d] rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Most Logged Genres
                    </span>
                    {sortedGenres.length > 0 ? (
                      <div className="space-y-3 mt-3">
                        {sortedGenres.map(([genreName, count], idx) => {
                          const percentage = Math.round((count / totalGenreLogs) * 100);
                          const colorClass = idx === 0 ? 'bg-[#00E59B]' : idx === 1 ? 'bg-[#00A2FF]' : 'bg-amber-400';
                          const textColorClass = idx === 0 ? 'text-[#00E59B]' : idx === 1 ? 'text-[#00A2FF]' : 'text-amber-400';

                          return (
                            <div key={genreName} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-300">{genreName}</span>
                                <span className={`font-bold ${textColorClass}`}>{percentage}% ({count})</span>
                              </div>
                              <div className="w-full bg-[#14181c] h-2 rounded-full overflow-hidden">
                                <div className={`${colorClass} h-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">
                        Belum ada data genre. Catat game di diary untuk melihat statistik kurasimu!
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#232b35] flex items-center justify-between text-xs">
                    <span className="text-gray-400">Average Rating Given</span>
                    <span className="font-bold text-[#00E59B]">{avgRatingGiven} ★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIARY */}
        {activeProfileTab === 'diary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#252f3b] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Diary Logs</h2>
                <p className="text-xs text-gray-400">
                  Chronological record of every Roblox session logged by {user.username}
                </p>
              </div>
            </div>

            {diaryLogs.length > 0 ? (
              <div className="bg-[#181e24] border border-[#26313d] rounded-2xl overflow-hidden divide-y divide-[#232b35]">
                {diaryLogs.map((log) => {
                  const game = getGameById(log.gameId);
                  if (!game) return null;

                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1d242c] transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <img
                          src={safeImgSrc(game.iconUrl)}
                          alt={game.name}
                          onClick={() => viewGame(game.id)}
                          className="w-14 h-14 rounded-xl object-cover cursor-pointer flex-shrink-0 border border-white/10 hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <h4 
                            onClick={() => viewGame(game.id)}
                            className="text-base font-bold text-white hover:text-[#00E59B] cursor-pointer transition-colors truncate"
                          >
                            {game.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="font-semibold text-gray-300">{log.loggedDate}</span>
                            <span>•</span>
                            <span>{game.genre}</span>
                            {log.isLiked && (
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            )}
                          </div>
                          {log.reviewText && (
                            <p className="text-xs text-gray-300 mt-2 line-clamp-2 max-w-2xl italic">
                              "{log.reviewText}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {log.rating ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-[#00E59B] font-bold text-sm">
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
                          className="text-xs font-semibold text-gray-400 hover:text-white px-2.5 py-1.5 rounded bg-[#222a33] hover:bg-[#2c3642] transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#181e24] rounded-2xl border border-[#252f3b] text-gray-400 text-xs">
                No diary entries yet. Log a game to start your Roblox gaming history!
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GAMES SHELF */}
        {activeProfileTab === 'games' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252f3b] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Shelf Collection</h2>
                <p className="text-xs text-gray-400">
                  Manage your tracked experiences across different shelves
                </p>
              </div>

              {/* Shelf Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto bg-[#181e24] p-1 rounded-xl border border-[#28323e]">
                <button
                  onClick={() => setShelfFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    shelfFilter === 'all' ? 'bg-[#27323f] text-[#00E59B]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All ({userLogs.length})
                </button>
                <button
                  onClick={() => setShelfFilter('played')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    shelfFilter === 'played' ? 'bg-[#27323f] text-[#00E59B]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Played ({playedCount})
                </button>
                <button
                  onClick={() => setShelfFilter('playing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    shelfFilter === 'playing' ? 'bg-[#27323f] text-[#00A2FF]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Playing ({playingCount})
                </button>
                <button
                  onClick={() => setShelfFilter('backlog')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    shelfFilter === 'backlog' ? 'bg-[#27323f] text-amber-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Backlog ({backlogCount})
                </button>
                <button
                  onClick={() => setShelfFilter('favorites')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    shelfFilter === 'favorites' ? 'bg-[#27323f] text-[#00E59B]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Favorites
                </button>
              </div>
            </div>

            {/* Grid of games */}
            {filteredShelfLogs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredShelfLogs.map((log) => {
                  const game = getGameById(log.gameId);
                  if (!game) return null;
                  return <GameCard key={log.id} game={game} layout="grid" userLog={log} />;
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#181e24] rounded-2xl border border-[#252f3b] text-gray-400 text-xs">
                No games found on this shelf. Browse the catalog to add games!
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVIEWS */}
        {activeProfileTab === 'reviews' && (
          <div className="space-y-6">
            <div className="border-b border-[#252f3b] pb-4">
              <h2 className="text-lg font-bold text-white">Your Written Reviews</h2>
              <p className="text-xs text-gray-400">
                All reviews authored by {user.username} with ratings and thoughts
              </p>
            </div>

            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((rev) => {
                  const game = getGameById(rev.gameId);
                  return (
                    <div
                      key={rev.id}
                      className="bg-[#181e24] border border-[#252f3b] rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          onClick={() => viewGame(rev.gameId)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={safeImgSrc(rev.gameIcon)}
                            alt={rev.gameTitle}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-[#00E59B] transition-colors">
                              {rev.gameTitle}
                            </h4>
                            <span className="text-[11px] text-gray-400">
                              Reviewed on {rev.loggedDate}
                            </span>
                          </div>
                        </div>

                        {rev.rating && (
                          <div className="flex items-center gap-1 text-[#00E59B] font-bold text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                            <Star className="w-4 h-4 fill-[#00E59B]" />
                            <span>{rev.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap pl-1">
                        {rev.reviewText}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#181e24] rounded-2xl border border-[#252f3b] text-gray-400 text-xs">
                You haven't written any reviews yet. Open a game and click "Log or Review" to write one!
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BACKLOG */}
        {activeProfileTab === 'backlog' && (
          <div className="space-y-6">
            <div className="border-b border-[#252f3b] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Backlog (Want to Play)</h2>
                <p className="text-xs text-gray-400">
                  Experiences saved for upcoming gaming sessions
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                {backlogCount} Games Queued
              </span>
            </div>

            {userLogs.filter(l => l.status === 'backlog').length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {userLogs
                  .filter(l => l.status === 'backlog')
                  .map(log => {
                    const game = getGameById(log.gameId);
                    if (!game) return null;
                    return <GameCard key={log.id} game={game} layout="grid" userLog={log} />;
                  })}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#181e24] rounded-2xl border border-[#252f3b] text-gray-400 text-xs">
                Your backlog is empty. Browse games and click the bookmark button to queue them up!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
