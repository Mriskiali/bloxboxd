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
  Loader2,
  Pencil
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
    t,
    addGamesToCatalog,
    updateUserProfile,
    showToast,
    saveGameLog
  } = useApp();

  const isViewingSelf = !selectedUserId || (user && (selectedUserId === user.id || selectedUserId.replace('user-roblox-', '') === user.id.replace('user-roblox-')));
  const isOwnProfile = Boolean(user && isViewingSelf);

  const [shelfFilter, setShelfFilter] = useState<'all' | ShelfStatus | 'favorites'>('all');
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [targetLogs, setTargetLogs] = useState<GameLog[]>([]);
  const [targetReviews, setTargetReviews] = useState<Review[]>([]);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isSyncingFavorites, setIsSyncingFavorites] = useState(false);

  const handleSyncRobloxFavorites = async () => {
    if (!user?.robloxUserId) return;
    setIsSyncingFavorites(true);
    try {
      const res = await fetch(`/api/roblox/user/${user.robloxUserId}/favorites`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games) && data.games.length > 0) {
          addGamesToCatalog(data.games);
          const top4Ids = data.games.slice(0, 4).map((g: any) => g.id);

          // 1. Sync Top 4 pinned favorite games to Profile & Turso DB
          await updateUserProfile({ favoriteGameIds: top4Ids });

          // 2. Automatically log synced favorite games into user's shelf & Turso
          const today = new Date().toISOString().split('T')[0];
          for (const fav of data.games) {
            saveGameLog({
              gameId: fav.id,
              status: 'played',
              isFavorite: true,
              isLiked: true,
              loggedDate: today
            });
          }

          showToast(
            language === 'id' 
              ? `Berhasil sinkron ${data.games.length} game favorit ke profil dan rak kamu!` 
              : `Successfully synced ${data.games.length} favorite games to your profile & shelf!`, 
            'success'
          );
        } else {
          showToast(
            language === 'id' 
              ? 'Tidak ada game favorit publik di akun Roblox kamu.' 
              : 'No public favorite games found on your Roblox profile.', 
            'info'
          );
        }
      }
    } catch (e) {
      console.warn('Sync error:', e);
      showToast(language === 'id' ? 'Gagal menyinkronkan favorit.' : 'Failed to sync favorites.', 'error');
    } finally {
      setIsSyncingFavorites(false);
    }
  };

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
          setTargetError(t('profile_not_registered'));
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
        setTargetError(t('profile_load_failed'));
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
        credentials: 'same-origin',
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

  if (isViewingSelf && !user) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 pt-10 sm:px-6">
        <div className="mx-auto max-w-xl border-y border-line py-14 text-center">
          <h2 className="bb-display text-[26px] sm:text-[30px]">
            {t('profile_login_title')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            {t('profile_login_desc')}
          </p>

          <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
            <div className="bg-bg p-4 text-left">
              <span className="bb-label block">{t('profile_feature_1_title')}</span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{t('profile_feature_1_desc')}</p>
            </div>
            <div className="bg-bg p-4 text-left">
              <span className="bb-label block">{t('profile_feature_2_title')}</span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{t('profile_feature_2_desc')}</p>
            </div>
            <div className="bg-bg p-4 text-left">
              <span className="bb-label block">{t('profile_feature_3_title')}</span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{t('profile_feature_3_desc')}</p>
            </div>
          </div>

          <button
            onClick={() => setLoginModalOpen(true)}
            className="bb-btn bb-btn-primary mt-8"
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
              <img
                src={safeAvatarSrc(activeUser.avatarUrl)}
                alt={activeUser.username}
                className="h-20 w-20 rounded-full border border-line object-cover sm:h-24 sm:w-24"
              />

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="bb-display text-[26px] sm:text-[30px]">
                    {activeUser.username}
                  </h1>
                  <span className="text-[13px] text-faint">@{activeUser.handle || activeUser.username}</span>
                  {activeUser.isRobloxVerified ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-green">
                      <span className="h-1.5 w-1.5 rounded-full bg-green" />
                      {t('profile_roblox_verified')}
                    </span>
                  ) : activeUser.robloxUserId ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue">
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

                <p className="mt-2 text-[12px] text-faint">
                  <span className="font-semibold text-ink">{followStats.followersCount}</span> {t('profile_followers')}
                  <span className="px-1.5">·</span>
                  <span className="font-semibold text-ink">{followStats.followingCount}</span> {t('profile_following')}
                </p>
              </div>
            </div>

            {/* Action Buttons: Roblox Login & Edit Profile OR Follow/Unfollow */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              {isOwnProfile ? (
                <>
                  {user?.robloxUserId && (
                    <button
                      onClick={handleSyncRobloxFavorites}
                      disabled={isSyncingFavorites}
                      className="bb-btn bb-btn-secondary"
                      title={language === 'id' ? 'Impor game favorit dari akun Roblox kamu' : 'Import favorite games from your Roblox account'}
                    >
                      {isSyncingFavorites ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-green" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-green" />
                      )}
                      <span>{language === 'id' ? 'Sinkron Favorit Roblox' : 'Sync Roblox Favorites'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="bb-btn bb-btn-secondary"
                  >
                    <span className="w-2.5 h-2.5 bg-white transform -rotate-12 rounded-[2px]" />
                    <span>{user?.robloxUserId ? t('nav_switch_account') : t('nav_login_roblox')}</span>
                  </button>

                  <button
                    onClick={() => setEditProfileModalOpen(true)}
                    className="bb-btn bb-btn-secondary"
                  >
                    <Settings className="w-3.5 h-3.5 text-green" />
                    <span>{t('nav_edit_profile')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={isTogglingFollow}
                  className={`bb-btn ${isFollowing ? 'bb-btn-secondary' : 'bb-btn-primary'}`}
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

          {/* Stats: one flat strip, not four boxes */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3">
            <button onClick={() => { setActiveProfileTab('games'); setShelfFilter('played'); }} className="group flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold text-white">{playedCount}</span>
              <span className="text-[11px] text-faint group-hover:text-muted">{t('profile_played_count')}</span>
            </button>
            <span className="h-3.5 w-px bg-line" />
            <button onClick={() => setActiveProfileTab('reviews')} className="group flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold text-white">{userReviews.length}</span>
              <span className="text-[11px] text-faint group-hover:text-muted">{t('profile_reviews_count')}</span>
            </button>
            <span className="h-3.5 w-px bg-line" />
            <button onClick={() => setActiveProfileTab('backlog')} className="group flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold text-white">{backlogCount}</span>
              <span className="text-[11px] text-faint group-hover:text-muted">{t('profile_backlog_count')}</span>
            </button>
            <span className="h-3.5 w-px bg-line" />
            <button onClick={() => setActiveProfileTab('diary')} className="group flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold text-white">{diaryLogs.length}</span>
              <span className="text-[11px] text-faint group-hover:text-muted">{t('profile_diary_count')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs (PRD Section 3.4) */}
      <div className="sticky top-12 z-20 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-[1280px] items-center gap-5 overflow-x-auto px-4 no-scrollbar smooth-touch-scroll sm:px-6">
          <button
            onClick={() => setActiveProfileTab('overview')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-[13px] font-medium transition-colors ${
              activeProfileTab === 'overview'
                ? 'text-white border-b-2 border-green -mb-px'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t('profile_tab_overview')}
          </button>

          <button
            onClick={() => setActiveProfileTab('diary')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-[13px] font-medium transition-colors ${
              activeProfileTab === 'diary'
                ? 'text-white border-b-2 border-green -mb-px'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('profile_tab_diary')} ({diaryLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('games')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-[13px] font-medium transition-colors ${
              activeProfileTab === 'games'
                ? 'text-white border-b-2 border-green -mb-px'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('profile_tab_shelf')} ({activeLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('reviews')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-[13px] font-medium transition-colors ${
              activeProfileTab === 'reviews'
                ? 'text-white border-b-2 border-green -mb-px'
                : 'text-muted hover:text-ink'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('profile_tab_reviews')} ({userReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('backlog')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-[13px] font-medium transition-colors ${
              activeProfileTab === 'backlog'
                ? 'text-white border-b-2 border-green -mb-px'
                : 'text-muted hover:text-ink'
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
                    className="text-[11px] font-semibold text-faint hover:text-ink"
                  >
                    {t('profile_change_favs')}
                  </button>
                )}
              </div>

              {/* Top 4: 2:3 posters with captions, Letterboxd-style */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[0, 1, 2, 3].map((slotIndex) => {
                  const game = favoriteGames[slotIndex];
                  if (game) {
                    return (
                      <article key={game.id} className="group">
                        <button
                          onClick={() => viewGame(game.id)}
                          className="bb-poster w-full hover:border-[#3d4d5c]"
                          aria-label={game.name}
                        >
                          <img src={safeImgSrc(game.iconUrl)} alt="" />
                        </button>
                        <p className="mt-1.5 truncate text-[12px] font-semibold text-ink group-hover:text-white">
                          {game.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.08em] text-faint">
                          #{slotIndex + 1} {t('profile_shelf_favorites')}
                        </p>
                      </article>
                    );
                  }

                  if (isOwnProfile) {
                    return (
                      <button
                        key={`empty-${slotIndex}`}
                        onClick={() => setEditProfileModalOpen(true)}
                        className="flex aspect-[2/3] flex-col items-center justify-center border border-dashed border-line text-center transition-colors hover:border-[#43525f]"
                      >
                        <Plus className="mb-1.5 h-5 w-5 text-faint" />
                        <span className="px-2 text-[11px] text-faint">
                          {t('profile_add_fav', { num: slotIndex + 1 })}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={`empty-${slotIndex}`}
                      className="flex aspect-[2/3] flex-col items-center justify-center border border-line-soft text-center"
                    >
                      <span className="text-[10px] uppercase tracking-[0.08em] text-faint">
                        #{slotIndex + 1}
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
                          <span className="flex items-center gap-1 text-[12px] font-semibold text-orange">
                            <Star className="h-3 w-3 fill-orange" strokeWidth={0} />
                            {log.rating.toFixed(1)}
                          </span>
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

                        <div className="flex items-center gap-2">
                          {rev.rating && (
                            <div className="flex items-center gap-1 text-green font-bold text-sm bg-black/40 px-3 py-1 rounded-[2px] border border-white/10">
                              <Star className="w-4 h-4 fill-green" />
                              <span>{rev.rating.toFixed(1)}</span>
                            </div>
                          )}

                          {isOwnProfile && (
                            <button
                              onClick={() => {
                                const g = getGameById(rev.gameId);
                                if (g) openLogModal(g);
                                else viewGame(rev.gameId);
                              }}
                              className="text-xs font-semibold text-muted hover:text-white px-2.5 py-1 rounded bg-panel hover:bg-panel-2 border border-line transition-colors cursor-pointer flex items-center gap-1"
                              title={language === 'id' ? 'Edit ulasan' : 'Edit review'}
                            >
                              <Pencil className="w-3 h-3 text-blue" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
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
