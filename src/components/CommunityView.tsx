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
  Loader2,
  Pencil
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { safeImgSrc, safeAvatarSrc, Review } from '../types';
import { ReviewCommentsModal } from './ReviewCommentsModal';

export const CommunityView: React.FC = () => {
  const { user, viewGame, viewList, likeReview, viewUserProfile, openLogModal, getGameById, language, t } = useApp();
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
      // No userId param: friend-highlighting is derived server-side from the
      // cookie session principal, so a client-supplied userId is spoofable.
      fetch('/api/community/feed')
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
        <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="bb-label">{t('community_desc')}</p>
            <h1 className="bb-display mt-1 text-[26px] sm:text-[30px]">{t('community_title')}</h1>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex w-full items-center gap-4 overflow-x-auto no-scrollbar sm:w-auto">
            <button
              onClick={() => setActiveTab('feed')}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap sm:flex-initial ${
                activeTab === 'feed'
                  ? 'text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('community_tab_feed')}</span>
              {activeTab === 'feed' && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-green" />}
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap sm:flex-initial ${
                activeTab === 'trending'
                  ? 'text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{t('community_tab_trending')}</span>
              {activeTab === 'trending' && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-green" />}
            </button>
          </div>
        </div>

        {/* Tab 1: Community Activity Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {isLoadingFeed ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted text-xs bg-panel rounded-[3px] border border-line">
                <Loader2 className="w-6 h-6 animate-spin text-green" />
                <span>{t('community_loading_feed')}</span>
              </div>
            ) : feedItems.length > 0 ? (
              <div className="space-y-3">
                {feedItems.map((act) => {
                  if (act.type === 'review') {
                    return (
                      <div 
                        key={act.id} 
                        className="bg-panel border border-line rounded-[3px] p-4 sm:p-5 hover:border-line transition-colors space-y-3"
                      >
                        {/* Author info & Game Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={safeAvatarSrc(act.userAvatar)} 
                              alt={act.username}
                              onClick={() => act.userId && viewUserProfile(act.userId)}
                              className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10 cursor-pointer hover:ring-green transition-colors" 
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <strong 
                                  onClick={() => act.userId && viewUserProfile(act.userId)}
                                  className="text-white font-bold cursor-pointer hover:text-green transition-colors"
                                >
                                  {act.username}
                                </strong>
                                <span className="text-muted">{t('community_reviewed')}</span>
                                <span 
                                  onClick={() => viewGame(act.gameId)}
                                  className="text-green font-bold hover:underline cursor-pointer"
                                >
                                  {act.gameTitle}
                                </span>
                              </div>
                              <span className="text-[10px] text-faint">
                                {new Date(act.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {act.rating && (
                            <div className="flex items-center gap-1 bg-bg px-2.5 py-1 rounded-[3px] border border-white/5 text-green text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-green" />
                              <span>{act.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex items-start gap-3 bg-bg p-3.5 rounded-[3px] border border-line">
                          <img 
                            src={safeImgSrc(act.gameIcon)} 
                            alt={act.gameTitle}
                            onClick={() => viewGame(act.gameId)}
                            className="w-12 h-12 rounded-[2px] object-cover bg-black/40 flex-shrink-0 cursor-pointer  transition-transform" 
                          />
                          <p className="text-xs text-ink leading-relaxed italic flex-1">
                            "{act.text}"
                          </p>
                        </div>

                        {/* Card Actions: Like & Comment */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => likeReview(act.id.replace('act-rev-', ''))}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-panel-2 hover:bg-panel-2 text-ink hover:text-white transition-colors"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 text-green" />
                              <span>{act.likesCount || 0} {t('community_like')}</span>
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-panel-2 hover:bg-panel-2 text-ink hover:text-white transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-blue" />
                              <span>{t('community_comment')}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => viewGame(act.gameId)}
                            className="text-green text-xs font-bold hover:underline flex items-center gap-1"
                          >
                            <span>{t('community_view_game')}</span>
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
                      className="bg-panel border border-line rounded-[3px] p-4 sm:p-5 hover:border-line transition-colors space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={safeAvatarSrc(act.userAvatar)} 
                          alt={act.username}
                          onClick={() => act.userId && viewUserProfile(act.userId)}
                          className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10 cursor-pointer hover:ring-green transition-colors" 
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <strong 
                              onClick={() => act.userId && viewUserProfile(act.userId)}
                              className="text-white font-bold cursor-pointer hover:text-green transition-colors"
                            >
                              {act.username}
                            </strong>
                            <span className="text-muted">{t('community_created_list')}</span>
                            <span 
                              onClick={() => viewList(act.listId)}
                              className="text-blue font-bold hover:underline cursor-pointer"
                            >
                              {act.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-faint">
                            {new Date(act.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {act.description && (
                        <p className="text-xs text-ink bg-bg p-3 rounded-[3px] border border-line">
                          {act.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-muted text-xs flex items-center gap-1">
                          <ListOrdered className="w-3.5 h-3.5 text-blue" />
                          <span>{t('community_items_in_list', { count: act.itemCount })}</span>
                        </span>
                        <button
                          onClick={() => viewList(act.listId)}
                          className="px-3 py-1.5 rounded-[2px] bg-blue/10 text-blue hover:bg-blue/20 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>{t('community_open_list')}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-panel rounded-[3px] border border-line p-8 space-y-2">
                <p className="text-sm font-bold text-white">{t('community_empty_feed')}</p>
                <p className="text-xs text-muted">{t('community_empty_feed_prompt')}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Trending & Leaderboard */}
        {activeTab === 'trending' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Trending Reviews This Week */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <Flame className="w-5 h-5 text-orange" />
                <h2 className="bb-label">
                  {t('community_trending_reviews')}
                </h2>
              </div>

              {isLoadingTrending ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-green" />
                  <span>{t('community_loading_trending')}</span>
                </div>
              ) : trendingReviews.length > 0 ? (
                <div className="space-y-3">
                  {trendingReviews.map((rev) => (
                    <div 
                      key={rev.id} 
                      className="bg-panel border border-line rounded-[3px] p-4 space-y-3 hover:border-line transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={safeAvatarSrc(rev.userAvatar)} 
                            alt={rev.username}
                            onClick={() => rev.userId && viewUserProfile(rev.userId)}
                            className="w-9 h-9 rounded-full object-cover bg-black/40 border border-white/10 cursor-pointer hover:ring-green transition-colors" 
                          />
                          <div>
                            <p 
                              onClick={() => rev.userId && viewUserProfile(rev.userId)}
                              className="text-xs font-bold text-white cursor-pointer hover:text-green transition-colors"
                            >
                              {rev.username}
                            </p>
                            <p 
                              onClick={() => viewGame(rev.gameId)}
                              className="text-xs text-green hover:underline cursor-pointer font-semibold truncate max-w-xs"
                            >
                              {rev.gameTitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-green font-bold text-xs bg-bg px-2 py-0.5 rounded-[2px]">
                          <Star className="w-3.5 h-3.5 fill-green" />
                          <span>{rev.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-ink italic bg-bg p-3 rounded-[3px] border border-line">
                        "{rev.reviewText}"
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => likeReview(rev.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-panel-2 text-ink hover:text-white"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 text-orange" />
                            <span>{rev.likesCount || 0} {t('community_like')}</span>
                          </button>
                          <button
                            onClick={() => setSelectedReviewForComments(rev)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-panel-2 text-ink hover:text-white"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue" />
                            <span>{t('community_comment')}</span>
                          </button>
                          {user && (rev.userId === user.id || rev.userId.replace('user-roblox-', '') === user.id.replace('user-roblox-')) && (
                            <button
                              onClick={() => {
                                const g = getGameById(rev.gameId);
                                if (g) openLogModal(g);
                                else viewGame(rev.gameId);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-panel-2 text-ink hover:text-white transition-colors cursor-pointer"
                              title={language === 'id' ? 'Edit ulasan kamu' : 'Edit your review'}
                            >
                              <Pencil className="w-3 h-3 text-blue" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => viewGame(rev.gameId)}
                          className="text-xs font-bold text-green hover:underline"
                        >
                          {t('community_view_game')} ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted py-10 text-center bg-panel rounded-[3px] border border-line">
                  {t('community_empty_trending')}
                </p>
              )}
            </div>

            {/* Right Column: Leaderboard */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-line">
                <Trophy className="w-5 h-5 text-blue" />
                <h2 className="bb-label">
                  {t('community_leaderboard')}
                </h2>
              </div>

              {isLoadingTrending ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-green" />
                  <span>{t('community_loading_leaderboard')}</span>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="bg-panel border border-line rounded-[3px] divide-y divide-line overflow-hidden">
                  {leaderboard.map((player) => (
                    <div 
                      key={player.id} 
                      onClick={() => player.id && viewUserProfile(player.id)}
                      className="p-3.5 flex items-center gap-3 hover:bg-panel-2 transition-colors cursor-pointer group"
                    >
                      {/* Rank Badge */}
                      <div className={`w-7 h-7 rounded-[3px] flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                        player.rank === 1 ? 'bg-blue text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]' :
                        player.rank === 2 ? 'bg-slate-300 text-black' :
                        player.rank === 3 ? 'bg-blue text-white' :
                        'bg-panel-2 text-ink'
                      }`}>
                        {player.rank}
                      </div>

                      {/* Avatar */}
                      <img 
                        src={safeAvatarSrc(player.avatarUrl)} 
                        alt={player.username}
                        className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10 flex-shrink-0 group- group-hover:ring-green transition-colors" 
                      />

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-green transition-colors truncate">
                          {player.username}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted">
                          <span>{player.logsCount} {t('community_logs')}</span>
                          <span>•</span>
                          <span>{player.reviewsCount} {t('community_reviews')}</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-green/10 border border-green/20 text-green text-[10px] font-semibold">
                          {player.score} {t('community_points')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted py-10 text-center bg-panel rounded-[3px] border border-line">
                  {t('community_empty_leaderboard')}
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
