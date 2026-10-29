import React, { useState, useEffect } from 'react';
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
  Award,
  ArrowLeft,
  UserPlus,
  Check,
  Loader2
} from 'lucide-react';
import { useApp, authHeaders } from '../context/AppContext';
import { GameCard } from './GameCard';
import { RatingStars } from './RatingStars';
import { ShelfStatus, safeImgSrc, safeAvatarSrc, UserProfile, GameLog, Review } from '../types';

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
    setLoginModalOpen,
    selectedUserId,
    setSelectedUserId,
    language,
    t
  } = useApp();

  const isOwnProfile = !selectedUserId || (user && selectedUserId === user.id);

  const [shelfFilter, setShelfFilter] = useState<'all' | ShelfStatus | 'favorites'>('all');
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [targetLogs, setTargetLogs] = useState<GameLog[]>([]);
  const [targetReviews, setTargetReviews] = useState<Review[]>([]);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
    if (isOwnProfile) {
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
      return;
    }

    if (!selectedUserId) return;

    setIsLoadingTarget(true);
    setTargetError(null);

    Promise.all([
      fetch(`/api/user/data?userId=${encodeURIComponent(selectedUserId)}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/users/${encodeURIComponent(selectedUserId)}/follow-status?currentUserId=${encodeURIComponent(user?.id || '')}`).then(r => r.ok ? r.json() : null)
    ])
      .then(([userData, followData]) => {
        if (userData && userData.profile) {
          setTargetProfile(userData.profile);
          setTargetLogs(userData.logs || []);
          setTargetReviews(userData.reviews || []);
        } else {
          setTargetError('Pengguna tidak ditemukan atau belum terdaftar di Bloxboxd.');
        }

        if (followData) {
          setIsFollowing(Boolean(followData.isFollowing));
          setFollowStats({
            followersCount: followData.followersCount || 0,
            followingCount: followData.followingCount || 0
          });
        }
      })
      .catch(err => {
        console.error('Error fetching target profile:', err);
        setTargetError('Gagal memuat profil pengguna.');
      })
      .finally(() => {
        setIsLoadingTarget(false);
      });
  }, [isOwnProfile, selectedUserId, user?.id]);

  const handleToggleFollow = async () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    if (!selectedUserId || isOwnProfile || isTogglingFollow) return;

    setIsTogglingFollow(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(selectedUserId)}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ followerId: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(Boolean(data.isFollowing));
        setFollowStats({
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0
        });
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  if (!isOwnProfile && isLoadingTarget) {
    return (
      <div className="min-h-screen pb-20 pt-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-panel border border-line rounded-3xl p-8 space-y-4 shadow-xl">
          <Loader2 className="w-8 h-8 text-green animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">{t('profile_loading')}</p>
        </div>
      </div>
    );
  }

  if (!isOwnProfile && (targetError || !targetProfile)) {
    return (
      <div className="min-h-screen pb-20 pt-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-panel border border-line rounded-3xl p-8 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-orange/10 text-orange flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h3 className="bb-label">{t('profile_not_found')}</h3>
          <p className="text-xs text-muted leading-relaxed">
            {targetError || (language === 'id' ? 'Pengguna ini belum terdaftar di Bloxboxd.' : 'This user is not registered on Bloxboxd yet.')}
          </p>
          <button
            onClick={() => setSelectedUserId(null)}
            className="px-5 py-2.5 bg-green hover:bg-[#00c94b] text-black text-xs font-bold rounded-[3px] transition-colors cursor-pointer"
          >
            {t('profile_back')}
          </button>
        </div>
      </div>
    );
  }

  if (isOwnProfile && !user) {
    return (
      <div className="min-h-screen pb-20 pt-10 px-4">
        <div className="max-w-2xl mx-auto bg-panel border border-line rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-green/10 border border-green/30 flex items-center justify-center">
            <span className="w-8 h-8 bg-green transform -rotate-12 rounded-[5px] shadow-[0_0_15px_rgba(0,229,155,0.7)]" />
          </div>
          <div className="space-y-2">
            <h2 className="bb-display text-[26px] sm:text-[30px]">
              {t('profile_login_title')}
            </h2>
            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
              {t('profile_login_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="bg-bg p-4 rounded-[3px] border border-line space-y-1">
              <span className="text-xs font-semibold text-green">{t('profile_feature_1_title')}</span>
              <p className="text-xs text-ink">{t('profile_feature_1_desc')}</p>
            </div>
            <div className="bg-bg p-4 rounded-[3px] border border-line space-y-1">
              <span className="text-xs font-semibold text-green">{t('profile_feature_2_title')}</span>
              <p className="text-xs text-ink">{t('profile_feature_2_desc')}</p>
            </div>
            <div className="bg-bg p-4 rounded-[3px] border border-line space-y-1">
              <span className="text-xs font-semibold text-green">{t('profile_feature_3_title')}</span>
              <p className="text-xs text-ink">{t('profile_feature_3_desc')}</p>
            </div>
          </div>

          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-8 py-3.5 bg-green hover:bg-[#00c94b] text-black font-semibold text-sm rounded-[3px] shadow-xl transition-colors  active:scale-95"
          >
            {t('profile_login_btn')}
          </button>
        </div>
      </div>
    );
  }

  const activeUser = isOwnProfile ? user! : targetProfile!;
  const activeLogs = isOwnProfile ? userLogs : targetLogs;

  // Stats
  const playedCount = activeLogs.filter(l => l.status === 'played').length;
  const playingCount = activeLogs.filter(l => l.status === 'playing').length;
  const backlogCount = activeLogs.filter(l => l.status === 'backlog').length;
  
  const userReviews: Review[] = isOwnProfile
    ? reviews.filter(r => r.userId === user?.id)
    : targetReviews.length > 0
      ? targetReviews
      : activeLogs
          .filter(l => l.reviewText && l.reviewText.trim().length > 0)
          .map(l => {
            const game = getGameById(l.gameId);
            return {
              id: l.id,
              gameId: l.gameId,
              gameTitle: game?.name || 'Roblox Experience',
              gameIcon: game?.iconUrl || '',
              userId: activeUser.id,
              username: activeUser.username,
              userAvatar: activeUser.avatarUrl,
              rating: l.rating,
              reviewText: l.reviewText || '',
              likesCount: 0,
              commentsCount: 0,
              loggedDate: l.loggedDate || l.createdAt || new Date().toISOString().split('T')[0],
              createdAt: l.createdAt || new Date().toISOString()
            };
          });

  const diaryLogs = [...activeLogs].filter(l => l.loggedDate).sort((a, b) => 
    new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime()
  );

  // Favorite 4 games
  const favoriteGames = (activeUser.favoriteGameIds || [])
    .map(id => getGameById(id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  // Filtered games on the "Games" shelf tab
  const filteredShelfLogs = activeLogs.filter(log => {
    if (shelfFilter === 'all') return true;
    if (shelfFilter === 'favorites') return log.isFavorite || (activeUser.favoriteGameIds || []).includes(log.gameId);
    return log.status === shelfFilter;
  });

  // Dynamic genre statistics from actual user logs
  const genreCounts: Record<string, number> = {};
  let totalRatingSum = 0;
  let ratedCount = 0;

  activeLogs.forEach(l => {
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
      <div className="bg-panel border-b border-line pt-8 pb-6 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {!isOwnProfile && (
            <button
              onClick={() => setSelectedUserId(null)}
              className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-white bg-bg px-3.5 py-1.5 rounded-[3px] border border-line hover:border-gray-500 transition-colors cursor-pointer w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('profile_back')}</span>
            </button>
          )}

          {/* User Info Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={safeAvatarSrc(activeUser.avatarUrl)}
                  alt={activeUser.username}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-[3px] object-cover bg-black border-2 border-green shadow-xl ring-4 ring-black/40"
                />
                <div className="absolute -bottom-1 -right-1 bg-green text-black text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                  PRO
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="bb-display text-[26px] sm:text-[30px]">
                    {activeUser.username}
                  </h1>
                  <span className="text-xs font-mono text-muted bg-panel-2 px-2.5 py-0.5 rounded-full border border-line">
                    @{activeUser.handle || activeUser.username}
                  </span>
                  {activeUser.isRobloxVerified ? (
                    <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded border border-green/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                      {t('profile_roblox_verified')}
                    </span>
                  ) : activeUser.robloxUserId ? (
                    <span className="text-[10px] font-bold text-blue bg-blue/10 px-2 py-0.5 rounded border border-blue/30">
                      {t('profile_roblox_linked')}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
                  {activeUser.robloxUsername && (
                    <span>Roblox: <strong className="text-white font-medium">@{activeUser.robloxUsername}</strong></span>
                  )}
                  {activeUser.robloxUserId && (
                    <>
                      <span>•</span>
                      <a 
                        href={`https://www.roblox.com/users/${activeUser.robloxUserId}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green hover:underline flex items-center gap-1"
                      >
                        <span>ID: {activeUser.robloxUserId}</span>
                      </a>
                    </>
                  )}
                  {activeUser.robloxFriendsCount !== undefined ? (
                    <>
                      <span>•</span>
                      <span>{activeUser.robloxFriendsCount} {t('profile_friends')}</span>
                    </>
                  ) : (activeUser as any).friendsCount !== undefined ? (
                    <>
                      <span>•</span>
                      <span>{(activeUser as any).friendsCount} {t('profile_friends')}</span>
                    </>
                  ) : null}
                  {activeUser.joinedDate && <span>• {activeUser.joinedDate}</span>}
                </p>

                {activeUser.bio && (
                  <p className="text-xs text-ink max-w-xl mt-2 leading-relaxed">
                    {activeUser.bio}
                  </p>
                )}

                <div className="flex items-center gap-2.5 text-xs text-ink font-semibold mt-2.5">
                  <span className="flex items-center gap-1.5 bg-panel px-3 py-1 rounded-[3px] border border-line">
                    <strong className="text-white font-bold">{followStats.followersCount}</strong>
                    <span className="text-muted">{t('profile_followers')}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-panel px-3 py-1 rounded-[3px] border border-line">
                    <strong className="text-white font-bold">{followStats.followingCount}</strong>
                    <span className="text-muted">{t('profile_following')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Roblox Login & Edit Profile OR Follow/Unfollow */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] text-xs font-bold transition-colors ${
                      user?.robloxUserId
                        ? 'bg-panel hover:bg-panel-2 border border-line text-ink hover:text-white'
                        : 'bg-blue hover:bg-blue text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 bg-white transform -rotate-12 rounded-[2px]" />
                    <span>{user?.robloxUserId ? t('nav_switch_account') : t('nav_login_roblox')}</span>
                  </button>

                  <button
                    onClick={() => setEditProfileModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-panel hover:bg-panel-2 border border-line text-xs font-bold text-ink hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-green" />
                    <span>{t('nav_edit_profile')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={isTogglingFollow}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-[3px] text-xs font-bold transition-colors active:scale-95 cursor-pointer ${
                    isFollowing
                      ? 'bg-panel-2 hover:bg-orange/10 hover:text-orange hover:border-orange/40 border border-line text-green'
                      : 'bg-green hover:bg-[#00c94b] text-black font-semibold shadow-[0_0_20px_rgba(0,229,155,0.3)]'
                  }`}
                >
                  {isTogglingFollow ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isFollowing ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isTogglingFollow ? t('profile_processing') : isFollowing ? t('profile_following_btn') : t('profile_follow_btn')}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar Counters (PRD Section 3.4) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-line">
            <div 
              onClick={() => { setActiveProfileTab('games'); setShelfFilter('played'); }}
              className="bg-bg border border-line rounded-[3px] p-3 text-center cursor-pointer hover:border-green/50 transition-colors"
            >
              <span className="text-2xl font-semibold text-white">{playedCount}</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted mt-0.5">
                {t('profile_played_count')}
              </span>
            </div>

            <div 
              onClick={() => setActiveProfileTab('reviews')}
              className="bg-bg border border-line rounded-[3px] p-3 text-center cursor-pointer hover:border-green/50 transition-colors"
            >
              <span className="text-2xl font-semibold text-green">{userReviews.length}</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted mt-0.5">
                {t('profile_reviews_count')}
              </span>
            </div>

            <div 
              onClick={() => { setActiveProfileTab('backlog'); }}
              className="bg-bg border border-line rounded-[3px] p-3 text-center cursor-pointer hover:border-blue/50 transition-colors"
            >
              <span className="text-2xl font-semibold text-blue">{backlogCount}</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted mt-0.5">
                {t('profile_backlog_count')}
              </span>
            </div>

            <div 
              onClick={() => setActiveProfileTab('diary')}
              className="bg-bg border border-line rounded-[3px] p-3 text-center cursor-pointer hover:border-blue/50 transition-colors"
            >
              <span className="text-2xl font-semibold text-blue">{diaryLogs.length}</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted mt-0.5">
                {t('profile_diary_count')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs (PRD Section 3.4) */}
      <div className="bg-bg border-b border-line sticky top-16 z-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar smooth-touch-scroll">
          <button
            onClick={() => setActiveProfileTab('overview')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold transition-colors whitespace-nowrap ${
              activeProfileTab === 'overview'
                ? 'bg-green text-black'
                : 'text-muted hover:text-white hover:bg-panel'
            }`}
          >
            {t('profile_tab_overview')}
          </button>

          <button
            onClick={() => setActiveProfileTab('diary')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'diary'
                ? 'bg-green text-black'
                : 'text-muted hover:text-white hover:bg-panel'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('profile_tab_diary')} ({diaryLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('games')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'games'
                ? 'bg-green text-black'
                : 'text-muted hover:text-white hover:bg-panel'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('profile_tab_shelf')} ({activeLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('reviews')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'reviews'
                ? 'bg-green text-black'
                : 'text-muted hover:text-white hover:bg-panel'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('profile_tab_reviews')} ({userReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('backlog')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeProfileTab === 'backlog'
                ? 'bg-green text-black'
                : 'text-muted hover:text-white hover:bg-panel'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t('profile_tab_backlog')} ({backlogCount})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8">
        {/* TAB 1: OVERVIEW */}
        {activeProfileTab === 'overview' && (
          <div className="space-y-10">
            {/* The Signature 4 Favorites (PRD Section 3.4 & 6.2 #3) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green" />
                  <h2 className="bb-label">
                    {t('profile_fav_title')}
                  </h2>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditProfileModalOpen(true)}
                    className="text-xs text-green hover:underline font-semibold"
                  >
                    {t('profile_change_favs')}
                  </button>
                )}
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
                        className="group relative aspect-square rounded-[3px] overflow-hidden bg-panel border-2 border-line hover:border-green cursor-pointer transition-colors duration-300 shadow-xl"
                      >
                        <img
                          src={safeImgSrc(game.iconUrl)}
                          alt={game.name}
                          className="w-full h-full object-cover group- transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-[10px] font-bold text-green uppercase tracking-[0.08em]">
                            #{slotIndex + 1} {t('profile_shelf_favorites')}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate">
                            {game.name}
                          </h4>
                        </div>
                      </div>
                    );
                  }

                  if (isOwnProfile) {
                    return (
                      <div
                        key={`empty-${slotIndex}`}
                        onClick={() => setEditProfileModalOpen(true)}
                        className="aspect-square rounded-[3px] border-2 border-dashed border-line hover:border-green bg-panel/50 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors group"
                      >
                        <Plus className="w-6 h-6 text-faint group-hover:text-green transition-colors mb-2" />
                        <span className="text-xs font-semibold text-muted group-hover:text-white">
                          {t('profile_add_fav', { num: slotIndex + 1 })}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`empty-${slotIndex}`}
                      className="aspect-square rounded-[3px] border-2 border-dashed border-line bg-panel/30 flex flex-col items-center justify-center p-4 text-center"
                    >
                      <span className="text-[10px] uppercase font-bold text-faint">
                        #{slotIndex + 1} {t('profile_shelf_favorites')}
                      </span>
                      <span className="text-xs text-faint mt-1">
                        {t('profile_empty_fav')}
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
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="bb-label flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue" />
                    <span>{t('profile_recent_activity')}</span>
                  </h3>
                  <button
                    onClick={() => setActiveProfileTab('diary')}
                    className="text-xs text-blue hover:underline"
                  >
                    {t('profile_view_all_diary')}
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
                        className="p-3.5 rounded-[3px] bg-panel border border-line hover:border-green/50 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={safeImgSrc(game.iconUrl)}
                            alt={game.name}
                            className="w-12 h-12 rounded-[2px] object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-green transition-colors truncate">
                              {game.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                              <span>{language === 'id' ? `Dimainkan pada ${log.loggedDate}` : `Played on ${log.loggedDate}`}</span>
                              {log.isLiked && <Heart className="w-3 h-3 text-orange fill-orange" />}
                            </div>
                          </div>
                        </div>

                        {log.rating ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-green bg-black/40 px-2.5 py-1 rounded-[2px]">
                            <Star className="w-3.5 h-3.5 fill-green" />
                            <span>{log.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted bg-panel-2 px-2 py-0.5 rounded">
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
                <div className="border-b border-line pb-3">
                  <h3 className="bb-label flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green" />
                    <span>{t('profile_curator_insights')}</span>
                  </h3>
                </div>

                <div className="bg-panel border border-line rounded-[3px] p-5 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-muted uppercase tracking-[0.08em]">
                      {t('profile_most_logged_genres')}
                    </span>
                    {sortedGenres.length > 0 ? (
                      <div className="space-y-3 mt-3">
                        {sortedGenres.map(([genreName, count], idx) => {
                          const percentage = Math.round((count / totalGenreLogs) * 100);
                          const colorClass = idx === 0 ? 'bg-green' : idx === 1 ? 'bg-blue' : 'bg-blue';
                          const textColorClass = idx === 0 ? 'text-green' : idx === 1 ? 'text-blue' : 'text-blue';

                          return (
                            <div key={genreName} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-ink">{genreName}</span>
                                <span className={`font-bold ${textColorClass}`}>{percentage}% ({count})</span>
                              </div>
                              <div className="w-full bg-bg h-2 rounded-full overflow-hidden">
                                <div className={`${colorClass} h-full transition-colors duration-500`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted mt-2">
                        {language === 'id' ? 'Belum ada data genre. Catat game di diary untuk melihat statistik kurasimu!' : 'No genre data yet. Log games in your diary to see curator insights!'}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-muted">{t('profile_avg_rating')}</span>
                    <span className="font-bold text-green">{avgRatingGiven} ★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIARY */}
        {activeProfileTab === 'diary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="bb-label">{t('profile_tab_diary')}</h2>
                <p className="text-xs text-muted">
                  {language === 'id' 
                    ? `Catatan kronologis setiap sesi bermain oleh ${activeUser.username}` 
                    : `Chronological record of every Roblox session logged by ${activeUser.username}`}
                </p>
              </div>
            </div>

            {diaryLogs.length > 0 ? (
              <div className="bg-panel border border-line rounded-[3px] overflow-hidden divide-y divide-line">
                {diaryLogs.map((log) => {
                  const game = getGameById(log.gameId);
                  if (!game) return null;

                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-panel transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <img
                          src={safeImgSrc(game.iconUrl)}
                          alt={game.name}
                          onClick={() => viewGame(game.id)}
                          className="w-14 h-14 rounded-[3px] object-cover cursor-pointer flex-shrink-0 border border-white/10  transition-transform"
                        />
                        <div className="min-w-0">
                          <h4 
                            onClick={() => viewGame(game.id)}
                            className="text-base font-bold text-white hover:text-green cursor-pointer transition-colors truncate"
                          >
                            {game.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
                            <span className="font-semibold text-ink">{log.loggedDate}</span>
                            <span>•</span>
                            <span>{game.genre}</span>
                            {log.isLiked && (
                              <Heart className="w-3.5 h-3.5 text-orange fill-orange" />
                            )}
                          </div>
                          {log.reviewText && (
                            <p className="text-xs text-ink mt-2 line-clamp-2 max-w-2xl italic">
                              "{log.reviewText}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {log.rating ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border border-white/10 rounded-[2px] text-green font-bold text-sm">
                            <Star className="w-4 h-4 fill-green" />
                            <span>{log.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted bg-panel-2 px-2.5 py-1 rounded">
                            {log.status}
                          </span>
                        )}

                        {isOwnProfile && (
                          <button
                            onClick={() => openLogModal(game)}
                            className="text-xs font-semibold text-muted hover:text-white px-2.5 py-1.5 rounded bg-panel hover:bg-panel-2 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-panel rounded-[3px] border border-line text-muted text-xs">
                {isOwnProfile
                  ? (language === 'id' ? 'Belum ada catatan diary. Catat game untuk memulai riwayat bermain Roblox!' : 'No diary entries yet. Log an experience to start your Roblox gaming history!')
                  : (language === 'id' ? `${activeUser.username} belum memiliki catatan aktivitas di diary.` : `${activeUser.username} has no diary activity yet.`)}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GAMES SHELF */}
        {activeProfileTab === 'games' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h2 className="bb-label">{t('profile_tab_shelf')}</h2>
                <p className="text-xs text-muted">
                  {isOwnProfile
                    ? (language === 'id' ? 'Kelola koleksi game yang kamu lacak di berbagai rak' : 'Manage your tracked experiences across different shelves')
                    : (language === 'id' ? `Koleksi game Roblox yang dilacak oleh ${activeUser.username}` : `Roblox experiences tracked by ${activeUser.username}`)}
                </p>
              </div>

              {/* Shelf Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto bg-panel p-1 rounded-[3px] border border-line">
                <button
                  onClick={() => setShelfFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[2px] transition-colors ${
                    shelfFilter === 'all' ? 'bg-panel-2 text-green' : 'text-muted hover:text-white'
                  }`}
                >
                  {t('profile_shelf_all')} ({activeLogs.length})
                </button>
                <button
                  onClick={() => setShelfFilter('played')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[2px] transition-colors ${
                    shelfFilter === 'played' ? 'bg-panel-2 text-green' : 'text-muted hover:text-white'
                  }`}
                >
                  {t('profile_shelf_played')} ({playedCount})
                </button>
                <button
                  onClick={() => setShelfFilter('playing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[2px] transition-colors ${
                    shelfFilter === 'playing' ? 'bg-panel-2 text-blue' : 'text-muted hover:text-white'
                  }`}
                >
                  {t('profile_shelf_playing')} ({playingCount})
                </button>
                <button
                  onClick={() => setShelfFilter('backlog')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[2px] transition-colors ${
                    shelfFilter === 'backlog' ? 'bg-panel-2 text-blue' : 'text-muted hover:text-white'
                  }`}
                >
                  {t('profile_shelf_backlog')} ({backlogCount})
                </button>
                <button
                  onClick={() => setShelfFilter('favorites')}
                  className={`px-3 py-1 text-xs font-semibold rounded-[2px] transition-colors ${
                    shelfFilter === 'favorites' ? 'bg-panel-2 text-green' : 'text-muted hover:text-white'
                  }`}
                >
                  {t('profile_shelf_favorites')}
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
              <div className="text-center py-16 bg-panel rounded-[3px] border border-line text-muted text-xs">
                {t('profile_no_shelf')}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVIEWS */}
        {activeProfileTab === 'reviews' && (
          <div className="space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="bb-label">
                {isOwnProfile ? (language === 'id' ? 'Ulasan yang Kamu Tulis' : 'Your Written Reviews') : (language === 'id' ? `Ulasan oleh ${activeUser.username}` : `Reviews by ${activeUser.username}`)}
              </h2>
              <p className="text-xs text-muted">
                {isOwnProfile
                  ? (language === 'id' ? 'Semua ulasan dan kesan bermain yang kamu bagikan' : `All reviews authored by ${activeUser.username} with ratings and thoughts`)
                  : (language === 'id' ? `Daftar review dan rating pengalaman Roblox dari ${activeUser.username}` : `List of Roblox reviews and ratings by ${activeUser.username}`)}
              </p>
            </div>

            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((rev) => {
                  return (
                    <div
                      key={rev.id}
                      className="bg-panel border border-line rounded-[3px] p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          onClick={() => viewGame(rev.gameId)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={safeImgSrc(rev.gameIcon)}
                            alt={rev.gameTitle}
                            className="w-12 h-12 rounded-[3px] object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-green transition-colors">
                              {rev.gameTitle}
                            </h4>
                            <span className="text-[11px] text-muted">
                              {language === 'id' ? `Diulas pada ${rev.loggedDate}` : `Reviewed on ${rev.loggedDate}`}
                            </span>
                          </div>
                        </div>

                        {rev.rating && (
                          <div className="flex items-center gap-1 text-green font-bold text-sm bg-black/40 px-3 py-1 rounded-[2px] border border-white/10">
                            <Star className="w-4 h-4 fill-green" />
                            <span>{rev.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap pl-1">
                        {rev.reviewText}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-panel rounded-[3px] border border-line text-muted text-xs">
                {t('profile_no_reviews')}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BACKLOG */}
        {activeProfileTab === 'backlog' && (
          <div className="space-y-6">
            <div className="border-b border-line pb-4 flex items-center justify-between">
              <div>
                <h2 className="bb-label">{t('profile_tab_backlog')}</h2>
                <p className="text-xs text-muted">
                  {isOwnProfile
                    ? (language === 'id' ? 'Daftar game yang disimpan untuk dimainkan nanti' : 'Experiences saved for upcoming gaming sessions')
                    : (language === 'id' ? `Pengalaman yang ingin dimainkan oleh ${activeUser.username}` : `Experiences ${activeUser.username} wants to play`)}
                </p>
              </div>
              <span className="text-xs font-bold text-blue bg-blue/10 px-3 py-1 rounded-full">
                {backlogCount} {language === 'id' ? 'Game di Antrean' : 'Games Queued'}
              </span>
            </div>

            {activeLogs.filter(l => l.status === 'backlog').length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {activeLogs
                  .filter(l => l.status === 'backlog')
                  .map(log => {
                    const game = getGameById(log.gameId);
                    if (!game) return null;
                    return <GameCard key={log.id} game={game} layout="grid" userLog={log} />;
                  })}
              </div>
            ) : (
              <div className="text-center py-16 bg-panel rounded-[3px] border border-line text-muted text-xs">
                {t('profile_no_backlog')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
