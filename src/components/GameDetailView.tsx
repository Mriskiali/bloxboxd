import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Eye, 
  Bookmark, 
  Heart, 
  Share2, 
  Plus, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare,
  Sparkles,
  Users,
  Compass,
  Calendar,
  ThumbsUp,
  Play,
  Pencil,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RatingStars } from './RatingStars';
import { RatingHistogram } from './RatingHistogram';
import { ReviewCommentsModal } from './ReviewCommentsModal';
import { safeImgSrc, safeAvatarSrc, Review, DEFAULT_ICON_URL } from '../types';
import { launchRobloxExperience } from '../utils/vibe';

export const GameDetailView: React.FC = () => {
  const { 
    selectedGameId, 
    getGameById, 
    getUserLogForGame, 
    toggleGameStatus, 
    toggleLike, 
    toggleFavorite, 
    openLogModal, 
    setActiveTab,
    backToCatalog,
    reviews,
    userLogs,
    likeReview,
    customLists,
    createList,
    updateGame,
    user,
    viewUserProfile,
    language,
    t
  } = useApp();

  const [revealedSpoilers, setRevealedSpoilers] = useState<{ [id: string]: boolean }>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportedReviews, setReportedReviews] = useState<{ [id: string]: boolean }>({});
  const [activeReviewFilter, setActiveReviewFilter] = useState<'top' | 'recent'>('top');
  const [activeReviewComments, setActiveReviewComments] = useState<Review | null>(null);

  const game = selectedGameId ? getGameById(selectedGameId) : null;
  const userLog = selectedGameId ? getUserLogForGame(selectedGameId) : undefined;

  // Auto-fetch live Roblox API stats if missing for this game
  useEffect(() => {
    if (!game) return;
    if (game.upVotes !== undefined && game.favoritedCount !== undefined && game.rawVisits !== undefined) {
      return;
    }

    fetch(`/api/roblox/batch?universeIds=${game.universeId}`)
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.length > 0) {
          const item = json.data[0];
          updateGame(game.id, {
            playerCount: item.playerCount ?? game.playerCount,
            totalVisits: item.totalVisits ?? game.totalVisits,
            rawVisits: item.rawVisits ?? game.rawVisits,
            favoritedCount: item.favoritedCount ?? game.favoritedCount,
            upVotes: item.upVotes ?? game.upVotes,
            downVotes: item.downVotes ?? game.downVotes,
            ratingAverage: item.ratingAverage ?? game.ratingAverage,
            ratingCount: item.ratingCount ?? game.ratingCount,
            ratingHistogram: item.ratingHistogram ?? game.ratingHistogram,
            bannerUrl: item.bannerUrl || game.bannerUrl
          });
        }
      })
      .catch(console.warn);
  }, [game?.id, game?.universeId]);

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-muted mb-4">{language === 'id' ? 'Tidak ada pengalaman yang dipilih.' : 'No experience selected.'}</p>
        <button
          onClick={backToCatalog}
          className="px-4 py-2 bg-green hover:bg-[#00c94b] text-black font-bold text-xs rounded-[2px] cursor-pointer transition-colors"
        >
          {t('detail_back_catalog')}
        </button>
      </div>
    );
  }

  const isPlayed = userLog?.status === 'played';
  const isBacklog = userLog?.status === 'backlog';
  const isPlaying = userLog?.status === 'playing';
  const isLiked = !!userLog?.isLiked;
  const isFavorite = Boolean(user?.favoriteGameIds?.includes(game.id) || userLog?.isFavorite);

  // Filter reviews for this game
  const gameReviews = reviews.filter(r => r.gameId === game.id);
  const sortedReviews = [...gameReviews].sort((a, b) => {
    if (activeReviewFilter === 'top') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleSpoiler = (reviewId: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReport = (reviewId: string) => {
    setReportedReviews(prev => ({ ...prev, [reviewId]: true }));
  };

  // Roblox direct links
  const robloxDeepLink = `roblox://experiences/start?placeId=${game.rootPlaceId}`;
  const robloxWebLink = `https://www.roblox.com/games/${game.rootPlaceId}`;

  return (
    <div className="min-h-screen pb-20">
      {/* Top sticky navigation bar so Back to Catalog is always accessible even when scrolled */}
      <div className="sticky top-12 z-30 w-full border-b border-line bg-bg/95 py-2 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          <button
            onClick={backToCatalog}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] bg-panel hover:bg-panel-2 border border-line hover:border-green text-xs font-bold text-white transition-colors cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-green group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('detail_back_catalog')}</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted truncate">
            <span 
              onClick={backToCatalog} 
              className="hover:text-white cursor-pointer hover:underline"
            >
              {t('detail_catalog_crumb')}
            </span>
            <span>/</span>
            <span className="text-white font-semibold truncate max-w-xs">{game.name}</span>
          </div>
        </div>
      </div>

      {/* Top Backdrop / Hero Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-bg">
        <img
          src={safeImgSrc(game.bannerUrl || game.iconUrl)}
          alt={game.name}
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_ICON_URL) {
              e.currentTarget.src = DEFAULT_ICON_URL;
            }
          }}
          className="h-full w-full object-cover object-center opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />


      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 -mt-36 sm:-mt-44 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Poster & Quick Action Buttons (PRD Section 6.2 #1) */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-4">
            {/* High-res Poster / Icon */}
            <div className="relative aspect-square w-52 overflow-hidden rounded-[3px] border border-line bg-panel sm:w-64 lg:w-72">
              <img
                src={safeImgSrc(game.iconUrl)}
                alt={game.name}
                onError={(e) => {
                  if (e.currentTarget.src !== DEFAULT_ICON_URL) {
                    e.currentTarget.src = DEFAULT_ICON_URL;
                  }
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-[2px] bg-black/80  text-[11px] font-bold text-green border border-white/10 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-green" />
                <span>{game.ratingAverage.toFixed(1)}</span>
              </div>
            </div>

            {/* Quick Action Panel ala Letterboxd */}
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-72 bg-panel border border-line rounded-[3px] p-4 space-y-3.5">
              {/* Primary "Log / Review" Action Button */}
              <button
                onClick={() => openLogModal(game)}
                className="bb-btn bb-btn-primary w-full"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{userLog ? (language === 'id' ? 'Edit Catatan atau Review' : 'Edit Log or Review') : t('detail_log_review')}</span>
              </button>

              {/* Status Toggle Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Played Toggle */}
                <button
                  onClick={() => toggleGameStatus(game.id, 'played')}
                  className={`flex flex-col items-center justify-center p-2 rounded-[2px] border text-xs font-semibold transition-colors ${
                    isPlayed
                      ? 'border-green bg-green/15 text-green'
                      : 'border-line bg-panel text-muted hover:text-white hover:bg-panel-2'
                  }`}
                  title={isPlayed ? t('card_marked_played') : t('card_mark_played')}
                >
                  <Eye className="w-4 h-4 mb-1" />
                  <span>{t('card_played')}</span>
                </button>

                {/* Backlog / Want to Play Toggle */}
                <button
                  onClick={() => toggleGameStatus(game.id, 'backlog')}
                  className={`flex flex-col items-center justify-center p-2 rounded-[2px] border text-xs font-semibold transition-colors ${
                    isBacklog
                      ? 'border-blue bg-blue/15 text-blue'
                      : 'border-line bg-panel text-muted hover:text-white hover:bg-panel-2'
                  }`}
                  title={isBacklog ? t('card_in_backlog') : t('card_add_backlog')}
                >
                  <Bookmark className="w-4 h-4 mb-1" />
                  <span>{t('card_backlog')}</span>
                </button>

                {/* Like Toggle */}
                <button
                  onClick={() => toggleLike(game.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-[2px] border text-xs font-semibold transition-colors ${
                    isLiked
                      ? 'border-orange bg-orange/15 text-orange'
                      : 'border-line bg-panel text-muted hover:text-orange hover:bg-panel-2'
                  }`}
                  title={isLiked ? t('card_liked') : t('card_like')}
                >
                  <Heart className={`w-4 h-4 mb-1 ${isLiked ? 'fill-orange' : ''}`} />
                  <span>{t('card_like')}</span>
                </button>
              </div>

              {/* Pin as Favorite Button */}
              <button
                onClick={() => toggleFavorite(game.id)}
                className={`w-full py-2 px-3 rounded-[2px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isFavorite
                    ? 'border-green bg-green/10 text-green'
                    : 'border-line bg-panel text-muted hover:text-white hover:bg-panel-2'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-green' : ''}`} />
                <span>{isFavorite ? (language === 'id' ? 'Tersemat di 4 Game Favorit' : 'Pinned in Top 4 Favorites') : (language === 'id' ? 'Sematkan ke 4 Favorit' : 'Pin to Top 4 Favorites')}</span>
              </button>

              {/* Direct Roblox Play CTA (PRD Section 3.3) */}
              <div className="pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => launchRobloxExperience(game.rootPlaceId)}
                  className="bb-btn bb-btn-primary w-full cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t('detail_play_roblox')}</span>
                </button>
                <p className="text-[10px] text-muted text-center mt-1.5 flex items-center justify-center gap-1.5">
                  <span>{language === 'id' ? 'Buka Roblox App' : 'Launch Roblox App'}</span>
                  <span>·</span>
                  <a
                    href={robloxWebLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white underline underline-offset-2 inline-flex items-center gap-0.5"
                  >
                    <span>{language === 'id' ? 'Web Resmi' : 'Official Web'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </p>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full py-1.5 text-xs text-muted hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? t('detail_link_copied') : (language === 'id' ? 'Bagikan Game' : 'Share Experience')}</span>
              </button>
            </div>

            {/* Technical Roblox Metadata Box */}
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-72 bg-panel border border-line rounded-[3px] p-4 text-xs space-y-2.5 text-muted">
              <div className="flex justify-between border-b border-line pb-1.5">
                <span>Root Place ID:</span>
                <span className="font-mono text-ink select-all">{game.rootPlaceId}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-1.5">
                <span>{t('detail_universe_id')}</span>
                <span className="font-mono text-ink select-all">{game.universeId}</span>
              </div>
              <div className="flex justify-between border-b border-line pb-1.5">
                <span>{t('detail_genre')}</span>
                <span className="font-medium text-ink">{game.genre}</span>
              </div>
              {game.subgenre && game.subgenre !== game.genre && (
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span>{t('detail_subgenre')}</span>
                  <span className="font-medium text-ink">{game.subgenre}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-line pb-1.5">
                <span>{t('detail_active_players')}</span>
                <span className="font-medium text-green">
                  {game.playerCount ? game.playerCount.toLocaleString(language === 'id' ? 'id-ID' : 'en-US') : t('card_active')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('detail_total_visits')}</span>
                <span className="font-medium text-ink">{game.totalVisits}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Title, Synopsis, Histogram, Reviews (PRD Section 6.2 #1) */}
          <div className="lg:col-span-8 space-y-7">
            {/* Title & Creator Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-green mb-1">
                <span>{game.genre}</span>
                {game.subgenre && game.subgenre !== game.genre && (
                  <span className="text-muted font-normal">/ {game.subgenre}</span>
                )}
                {game.releaseYear && <span>• {game.releaseYear}</span>}
              </div>
              <h1 className="bb-display text-[30px] sm:text-[36px]">
                {game.name}
              </h1>
              <p className="text-sm text-ink mt-1 flex items-center gap-2">
                <span>{t('detail_developed_by')}</span>
                <span className="font-semibold text-white">
                  {game.creatorName} ({game.creatorType})
                </span>
              </p>
            </div>

            {/* Synopsis / Description */}
            <div className="bg-panel border border-line rounded-[3px] p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted mb-2">
                {t('detail_synopsis')}
              </h3>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                {game.description}
              </p>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-line">
                {game.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-ink bg-bg border border-line px-2.5 py-1 rounded-[2px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Aggregate Bloxboxd Stats & Rating Histogram */}
            {(() => {
              const totalVisitsDisplay = game.rawVisits 
                ? (game.rawVisits >= 1_000_000_000 
                    ? `${(game.rawVisits / 1_000_000_000).toFixed(1)}B+`
                    : game.rawVisits >= 1_000_000 
                      ? `${(game.rawVisits / 1_000_000).toFixed(1)}M+`
                      : game.rawVisits.toLocaleString(language === 'id' ? 'id-ID' : 'en-US'))
                : (game.totalVisits || '0');

              const backlogsCount = userLogs.filter(l => l.gameId === game.id && l.status === 'backlog').length 
                + customLists.filter(cl => cl.items.some(it => it.gameId === game.id)).length;

              const favoritedDisplay = game.favoritedCount !== undefined 
                ? (game.favoritedCount >= 1_000_000 
                    ? `${(game.favoritedCount / 1_000_000).toFixed(1)}M`
                    : game.favoritedCount >= 1_000 
                      ? `${(game.favoritedCount / 1_000).toFixed(1)}K`
                      : game.favoritedCount.toLocaleString(language === 'id' ? 'id-ID' : 'en-US'))
                : '0';

              const reviewsCount = gameReviews.length;

              return (
                <div className="space-y-6">
                  {/* One flat meta strip instead of four boxes */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-3">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[17px] font-semibold text-white">{totalVisitsDisplay}</span>
                      <span className="text-[11px] text-faint">{t('detail_total_visits').replace(':', '').toLowerCase()}</span>
                    </span>
                    <span className="h-4 w-px bg-line" />
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[17px] font-semibold text-white">{backlogsCount.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</span>
                      <span className="text-[11px] text-faint">{t('detail_in_backlogs').toLowerCase()}</span>
                    </span>
                    <span className="h-4 w-px bg-line" />
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[17px] font-semibold text-white">{favoritedDisplay}</span>
                      <span className="text-[11px] text-faint">{t('detail_favorited').toLowerCase()}</span>
                    </span>
                    <span className="h-4 w-px bg-line" />
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[17px] font-semibold text-white">{reviewsCount.toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</span>
                      <span className="text-[11px] text-faint">{t('detail_reviews_count').toLowerCase()}</span>
                    </span>
                  </div>

                  <RatingHistogram
                    histogram={game.ratingHistogram}
                    totalCount={game.ratingCount}
                    averageRating={game.ratingAverage}
                    upVotes={game.upVotes}
                    downVotes={game.downVotes}
                  />
                </div>
              );
            })()}

            {/* Community Reviews Section (PRD Section 6.2 #1) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="bb-label">
                    {t('detail_community_reviews')}
                  </h2>
                  <span className="text-[11px] tabular-nums text-faint">{gameReviews.length}</span>
                </div>

                {/* Filter and Log button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-panel border border-line rounded-[2px] p-0.5 text-xs">
                    <button
                      onClick={() => setActiveReviewFilter('top')}
                      className={`px-2.5 py-1 rounded-[2px] font-semibold transition-colors ${
                        activeReviewFilter === 'top' 
                          ? 'bg-panel-2 text-green' 
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      {t('detail_sort_top')}
                    </button>
                    <button
                      onClick={() => setActiveReviewFilter('recent')}
                      className={`px-2.5 py-1 rounded-[2px] font-semibold transition-colors ${
                        activeReviewFilter === 'recent' 
                          ? 'bg-panel-2 text-green' 
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      {t('detail_sort_newest')}
                    </button>
                  </div>

                  <button
                    onClick={() => openLogModal(game)}
                    className="px-3 py-1.5 rounded-[2px] bg-panel hover:bg-panel-2 border border-line text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-green" />
                    <span>{t('detail_write_review')}</span>
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              {sortedReviews.length > 0 ? (
                <div className="space-y-3.5">
                  {sortedReviews.map((rev) => {
                    const isRevealed = revealedSpoilers[rev.id];
                    const isReported = reportedReviews[rev.id];

                    return (
                      <div
                        key={rev.id}
                        className="bg-panel border border-line rounded-[3px] p-4 transition-colors"
                      >
                        {/* Reviewer Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div 
                            onClick={() => viewUserProfile(rev.userId)}
                            className="flex items-center gap-2.5 cursor-pointer group"
                            title={`Lihat profil ${rev.username}`}
                          >
                            <img
                              src={safeAvatarSrc(rev.userAvatar)}
                              alt={rev.username}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-green transition-colors"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white group-hover:text-green transition-colors">
                                  {rev.username}
                                </span>
                                {rev.rating && (
                                  <div className="flex items-center text-green text-xs font-bold">
                                    <Star className="w-3 h-3 fill-green mr-0.5" />
                                    <span>{rev.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-muted">
                                {rev.loggedDate}
                              </span>
                            </div>
                          </div>

                          {/* Like & Comments buttons */}
                          <div className="flex items-center gap-2">
                            {user && (rev.userId === user.id || rev.userId.replace('user-roblox-', '') === user.id.replace('user-roblox-')) && (
                              <button
                                onClick={() => openLogModal(game)}
                                className="flex items-center gap-1 px-2 py-1 rounded-[2px] text-xs font-medium bg-panel text-muted hover:text-white hover:bg-panel-2 transition-colors cursor-pointer"
                                title={language === 'id' ? 'Edit Ulasan Kamu' : 'Edit Your Review'}
                              >
                                <Pencil className="w-3 h-3 text-blue" />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              onClick={() => likeReview(rev.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] text-xs font-medium transition-colors ${
                                rev.isLiked 
                                  ? 'bg-orange/15 text-orange' 
                                  : 'bg-panel text-muted hover:text-white'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{rev.likesCount || 0}</span>
                            </button>

                            <button
                              onClick={() => setActiveReviewComments(rev)}
                              className="flex items-center gap-1 px-2 py-1 rounded-[2px] text-xs font-medium bg-panel text-muted hover:text-blue hover:bg-blue/10 transition-colors"
                              title={language === 'id' ? "Lihat & Tulis Komentar" : "View & Write Comments"}
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{rev.commentsCount || 0}</span>
                            </button>

                            {/* Report review (PRD Section 7) */}
                            <button
                              onClick={() => handleReport(rev.id)}
                              title={language === 'id' ? "Laporkan ulasan yang tidak pantas" : "Report inappropriate review"}
                              className="p-1 text-muted hover:text-orange transition-colors"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Spoiler Mask or Normal Text */}
                        {rev.hasSpoilers && !isRevealed ? (
                          <div 
                            onClick={() => toggleSpoiler(rev.id)}
                            className="bg-panel border border-dashed border-blue/40 rounded-[2px] p-3.5 cursor-pointer text-center hover:bg-panel-2 transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue mb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{t('detail_spoiler_warning')} ({game.name})</span>
                            </div>
                            <span className="text-[11px] text-muted underline">
                              {t('detail_show_spoiler')}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">
                            {rev.reviewText}
                          </p>
                        )}

                        {isReported && (
                          <div className="mt-2 text-[10px] text-blue bg-blue/10 p-1.5 rounded text-center">
                            {language === 'id' ? 'Ulasan telah dilaporkan ke moderator Bloxboxd untuk ditinjau.' : 'Review has been reported to Bloxboxd moderators for review.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-panel border border-line rounded-[3px] text-muted text-xs">
                  {t('detail_no_reviews_title')} {t('detail_no_reviews_desc')}
                </div>
              )}

              {/* Bottom Back to Catalog Action */}
              <div className="pt-6 border-t border-line flex items-center justify-between">
                <button
                  onClick={backToCatalog}
                  className="flex items-center gap-2 px-4 py-2 rounded-[3px] bg-panel hover:bg-panel-2 border border-line hover:border-green text-xs font-bold text-white transition-colors cursor-pointer shadow-sm group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-green group-hover:-translate-x-0.5 transition-transform" />
                  <span>{t('detail_back_catalog')}</span>
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-xs text-muted hover:text-white transition-colors"
                >
                  {language === 'id' ? 'Kembali ke atas ↑' : 'Back to top ↑'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReviewCommentsModal
        review={activeReviewComments}
        isOpen={Boolean(activeReviewComments)}
        onClose={() => setActiveReviewComments(null)}
      />
    </div>
  );
};
