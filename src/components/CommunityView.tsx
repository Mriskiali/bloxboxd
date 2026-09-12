import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Flame, 
  Trophy, 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ListOrdered, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { safeImgSrc, safeAvatarSrc, Review } from '../types';
import { ReviewCommentsModal } from './ReviewCommentsModal';

export const CommunityView: React.FC = () => {
  const { user, viewGame, viewList, likeReview } = useApp();
  const [activeTab, setActiveTab] = useState<'feed' | 'trending'>('feed');
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [trendingReviews, setTrendingReviews] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [selectedReviewForComments, setSelectedReviewForComments] = useState<Review | null>(null);

  // Fetch Feed
  useEffect(() => {
    if (activeTab === 'feed') {
      setIsLoadingFeed(true);
      const url = user?.id ? `/api/community/feed?userId=${encodeURIComponent(user.id)}` : '/api/community/feed';
      fetch(url)
        .then(res => res.ok ? res.json() : { feed: [] })
        .then(data => {
          if (Array.isArray(data.feed)) {
            setFeedItems(data.feed);
          }
        })
        .catch(err => console.warn('Feed load error:', err))
        .finally(() => setIsLoadingFeed(false));
    }
  }, [activeTab, user?.id]);

  // Fetch Trending & Leaderboard
  useEffect(() => {
    if (activeTab === 'trending') {
      setIsLoadingTrending(true);
      fetch('/api/community/trending')
        .then(res => res.ok ? res.json() : { trendingReviews: [], leaderboard: [] })
        .then(data => {
          if (Array.isArray(data.trendingReviews)) setTrendingReviews(data.trendingReviews);
          if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
        })
        .catch(err => console.warn('Trending load error:', err))
        .finally(() => setIsLoadingTrending(false));
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Sub-Tabs */}
        <div className="bg-[#182028] border border-[#273341] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#00E59B]" />
              <span>Komunitas Bloxboxd</span>
            </h1>
            <p className="text-xs text-gray-400">
              Temukan aktivitas terbaru sesama gamer Roblox, ulasan paling populer, dan pemain teraktif.
            </p>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-[#131920] border border-[#263341] rounded-xl p-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'feed'
                  ? 'bg-[#00E59B] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friend & Community Feed</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'trending'
                  ? 'bg-[#00E59B] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Trending & Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Community Activity Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {isLoadingFeed ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400 text-xs bg-[#151c23] rounded-2xl border border-[#232f3c]">
                <Loader2 className="w-6 h-6 animate-spin text-[#00E59B]" />
                <span>Memuat aktivitas komunitas...</span>
              </div>
            ) : feedItems.length > 0 ? (
              <div className="space-y-3">
                {feedItems.map((act) => {
                  if (act.type === 'review') {
                    return (
                      <div 
                        key={act.id} 
                        className="bg-[#182028] border border-[#253240] rounded-2xl p-4 sm:p-5 hover:border-[#2f3f50] transition-all shadow-md space-y-3"
                      >
                        {/* Author info & Game Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={safeAvatarSrc(act.userAvatar)} 
                              alt={act.username}
                              className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10" 
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <strong className="text-white font-bold">{act.username}</strong>
                                <span className="text-gray-400">mengulas</span>
                                <span 
                                  onClick={() => viewGame(act.gameId)}
                                  className="text-[#00E59B] font-bold hover:underline cursor-pointer"
                                >
                                  {act.gameTitle}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500">
                                {new Date(act.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {act.rating && (
                            <div className="flex items-center gap-1 bg-[#12171e] px-2.5 py-1 rounded-xl border border-white/5 text-[#00E59B] text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-[#00E59B]" />
                              <span>{act.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex items-start gap-3 bg-[#131920] p-3.5 rounded-xl border border-[#232c37]">
                          <img 
                            src={safeImgSrc(act.gameIcon)} 
                            alt={act.gameTitle}
                            onClick={() => viewGame(act.gameId)}
                            className="w-12 h-12 rounded-lg object-cover bg-black/40 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" 
                          />
                          <p className="text-xs text-gray-200 leading-relaxed italic flex-1">
                            "{act.text}"
                          </p>
                        </div>

                        {/* Card Actions: Like & Comment */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => likeReview(act.id.replace('act-rev-', ''))}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202934] hover:bg-[#283442] text-gray-300 hover:text-white transition-colors"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 text-[#00E59B]" />
                              <span>{act.likesCount || 0} Suka</span>
                            </button>
                            <button
                              onClick={() => setSelectedReviewForComments({
                                id: act.id.replace('act-rev-', ''),
                                gameId: act.gameId,
                                gameTitle: act.gameTitle,
                                gameIcon: act.gameIcon,
                                userId: act.userId,
                                username: act.username,
                                userAvatar: act.userAvatar,
                                rating: act.rating,
                                reviewText: act.text,
                                hasSpoilers: false,
                                isLiked: false,
                                likesCount: act.likesCount,
                                loggedDate: act.createdAt,
                                createdAt: act.createdAt
                              })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202934] hover:bg-[#283442] text-gray-300 hover:text-white transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                              <span>Komentari</span>
                            </button>
                          </div>

                          <button
                            onClick={() => viewGame(act.gameId)}
                            className="text-[#00E59B] text-xs font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Lihat Game</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // List activity card
                  return (
                    <div 
                      key={act.id} 
                      className="bg-[#182028] border border-[#253240] rounded-2xl p-4 sm:p-5 hover:border-[#2f3f50] transition-all shadow-md space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={safeAvatarSrc(act.userAvatar)} 
                          alt={act.username}
                          className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10" 
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <strong className="text-white font-bold">{act.username}</strong>
                            <span className="text-gray-400">membuat daftar game baru:</span>
                            <span 
                              onClick={() => viewList(act.listId)}
                              className="text-[#00A2FF] font-bold hover:underline cursor-pointer"
                            >
                              {act.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {new Date(act.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {act.description && (
                        <p className="text-xs text-gray-300 bg-[#131920] p-3 rounded-xl border border-[#232c37]">
                          {act.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <ListOrdered className="w-3.5 h-3.5 text-[#00A2FF]" />
                          <span>{act.itemCount} Game di dalam list</span>
                        </span>
                        <button
                          onClick={() => viewList(act.listId)}
                          className="px-3 py-1.5 rounded-lg bg-[#00A2FF]/10 text-[#00A2FF] hover:bg-[#00A2FF]/20 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Buka List</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#182028] rounded-2xl border border-[#253240] p-8 space-y-2">
                <p className="text-sm font-bold text-white">Belum ada aktivitas komunitas.</p>
                <p className="text-xs text-gray-400">Jadilah yang pertama menulis ulasan atau membuat daftar game!</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Trending & Leaderboard */}
        {activeTab === 'trending' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Trending Reviews This Week */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#253240]">
                <Flame className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-extrabold text-white">
                  Trending Reviews Minggu Ini
                </h2>
              </div>

              {isLoadingTrending ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-[#00E59B]" />
                  <span>Memuat review trending...</span>
                </div>
              ) : trendingReviews.length > 0 ? (
                <div className="space-y-3">
                  {trendingReviews.map((rev) => (
                    <div 
                      key={rev.id}
                      className="bg-[#182028] border border-[#253240] rounded-2xl p-4 space-y-3 hover:border-[#2e3b4a] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={safeAvatarSrc(rev.userAvatar)} 
                            alt={rev.username}
                            className="w-9 h-9 rounded-full object-cover bg-black/40 border border-white/10" 
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{rev.username}</p>
                            <p 
                              onClick={() => viewGame(rev.gameId)}
                              className="text-xs text-[#00E59B] hover:underline cursor-pointer font-semibold truncate max-w-xs"
                            >
                              {rev.gameTitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[#00E59B] font-bold text-xs bg-[#12171e] px-2 py-0.5 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-[#00E59B]" />
                          <span>{rev.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-200 italic bg-[#131920] p-3 rounded-xl border border-[#232c37]">
                        "{rev.reviewText}"
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => likeReview(rev.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202934] text-gray-300 hover:text-white"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
                            <span>{rev.likesCount || 0} Likes</span>
                          </button>
                          <button
                            onClick={() => setSelectedReviewForComments(rev)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202934] text-gray-300 hover:text-white"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>Komentar</span>
                          </button>
                        </div>

                        <button
                          onClick={() => viewGame(rev.gameId)}
                          className="text-xs font-bold text-[#00E59B] hover:underline"
                        >
                          Lihat Game ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-10 text-center bg-[#182028] rounded-2xl border border-[#253240]">
                  Belum ada ulasan populer minggu ini.
                </p>
              )}
            </div>

            {/* Right Column: Leaderboard */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#253240]">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-extrabold text-white">
                  Leaderboard Pemain Teraktif
                </h2>
              </div>

              {isLoadingTrending ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-[#00E59B]" />
                  <span>Memuat leaderboard...</span>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="bg-[#182028] border border-[#253240] rounded-2xl divide-y divide-[#232c37] overflow-hidden shadow-md">
                  {leaderboard.map((player) => (
                    <div 
                      key={player.id} 
                      className="p-3.5 flex items-center gap-3 hover:bg-[#1f2833] transition-colors"
                    >
                      {/* Rank Badge */}
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        player.rank === 1 ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]' :
                        player.rank === 2 ? 'bg-slate-300 text-black' :
                        player.rank === 3 ? 'bg-amber-700 text-white' :
                        'bg-[#242f3c] text-gray-300'
                      }`}>
                        {player.rank}
                      </div>

                      {/* Avatar */}
                      <img 
                        src={safeAvatarSrc(player.avatarUrl)} 
                        alt={player.username}
                        className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10 flex-shrink-0" 
                      />

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{player.username}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span>{player.logsCount} Log Game</span>
                          <span>•</span>
                          <span>{player.reviewsCount} Review</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-[#00E59B]/10 border border-[#00E59B]/20 text-[#00E59B] text-[10px] font-black">
                          {player.score} Poin
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-10 text-center bg-[#182028] rounded-2xl border border-[#253240]">
                  Belum ada data pemain di leaderboard.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Review Comments Modal */}
        <ReviewCommentsModal
          review={selectedReviewForComments}
          isOpen={Boolean(selectedReviewForComments)}
          onClose={() => setSelectedReviewForComments(null)}
        />
      </div>
    </div>
  );
};
