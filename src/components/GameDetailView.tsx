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
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RatingStars } from './RatingStars';
import { RatingHistogram } from './RatingHistogram';
import { ReviewCommentsModal } from './ReviewCommentsModal';
import { safeImgSrc, safeAvatarSrc, Review, DEFAULT_ICON_URL } from '../types';

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
    user
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
        <p className="text-gray-400 mb-4">No experience selected.</p>
        <button
          onClick={backToCatalog}
          className="px-4 py-2 bg-[#00E59B] hover:bg-[#00c988] text-black font-bold text-xs rounded-lg cursor-pointer transition-all shadow-md"
        >
          Back to Catalog
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
      <div className="sticky top-16 z-30 w-full bg-[#14181c]/95 backdrop-blur-md border-b border-[#232b35] py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={backToCatalog}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1b222a] hover:bg-[#232c37] border border-[#2d3744] hover:border-[#00E59B] text-xs font-bold text-white transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00E59B] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Catalog</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 truncate">
            <span 
              onClick={backToCatalog} 
              className="hover:text-white cursor-pointer hover:underline"
            >
              Catalog
            </span>
            <span>/</span>
            <span className="text-white font-semibold truncate max-w-xs">{game.name}</span>
          </div>
        </div>
      </div>

      {/* Top Backdrop / Hero Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#111519]">
        <img
          src={safeImgSrc(game.bannerUrl || game.iconUrl)}
          alt={game.name}
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_ICON_URL) {
              e.currentTarget.src = DEFAULT_ICON_URL;
            }
          }}
          className="w-full h-full object-cover object-center opacity-30 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-[#14181c]/70 to-transparent" />


      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-36 sm:-mt-44 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Poster & Quick Action Buttons (PRD Section 6.2 #1) */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-4">
            {/* High-res Poster / Icon */}
            <div className="relative aspect-square w-52 sm:w-64 lg:w-72 rounded-2xl overflow-hidden bg-[#181e24] border-2 border-[#2b3542] shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
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
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-bold text-[#00E59B] border border-white/10 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#00E59B]" />
                <span>{game.ratingAverage.toFixed(1)}</span>
              </div>
            </div>

            {/* Quick Action Panel ala Letterboxd */}
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-72 bg-[#181e24] border border-[#28323e] rounded-xl p-4 space-y-3.5 shadow-lg">
              {/* Primary "Log / Review" Action Button */}
              <button
                onClick={() => openLogModal(game)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,229,155,0.35)]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{userLog ? 'Edit Log or Review' : 'Log or Review'}</span>
              </button>

              {/* Status Toggle Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Played Toggle */}
                <button
                  onClick={() => toggleGameStatus(game.id, 'played')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                    isPlayed
                      ? 'border-[#00E59B] bg-[#00E59B]/15 text-[#00E59B]'
                      : 'border-[#27323e] bg-[#1c232b] text-gray-400 hover:text-white hover:bg-[#242d38]'
                  }`}
                  title={isPlayed ? 'Marked as Played' : 'Mark as Played'}
                >
                  <Eye className="w-4 h-4 mb-1" />
                  <span>{isPlayed ? 'Played' : 'Played'}</span>
                </button>

                {/* Backlog / Want to Play Toggle */}
                <button
                  onClick={() => toggleGameStatus(game.id, 'backlog')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                    isBacklog
                      ? 'border-amber-400 bg-amber-400/15 text-amber-400'
                      : 'border-[#27323e] bg-[#1c232b] text-gray-400 hover:text-white hover:bg-[#242d38]'
                  }`}
                  title={isBacklog ? 'In Backlog' : 'Want to Play'}
                >
                  <Bookmark className="w-4 h-4 mb-1" />
                  <span>Backlog</span>
                </button>

                {/* Like Toggle */}
                <button
                  onClick={() => toggleLike(game.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                    isLiked
                      ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                      : 'border-[#27323e] bg-[#1c232b] text-gray-400 hover:text-rose-400 hover:bg-[#242d38]'
                  }`}
                  title={isLiked ? 'Liked' : 'Like'}
                >
                  <Heart className={`w-4 h-4 mb-1 ${isLiked ? 'fill-rose-500' : ''}`} />
                  <span>Like</span>
                </button>
              </div>

              {/* Pin as Favorite Button */}
              <button
                onClick={() => toggleFavorite(game.id)}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isFavorite
                    ? 'border-[#00E59B] bg-[#00E59B]/10 text-[#00E59B]'
                    : 'border-[#27323e] bg-[#1c232b] text-gray-400 hover:text-white hover:bg-[#242d38]'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#00E59B]' : ''}`} />
                <span>{isFavorite ? 'Pinned in Top 4 Favorites' : 'Pin to Top 4 Favorites'}</span>
              </button>

              {/* Direct Roblox Play CTA (PRD Section 3.3) */}
              <div className="pt-2 border-t border-[#252f3b]">
                <a
                  href={robloxWebLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-lg bg-[#00A2FF] hover:bg-[#0090e3] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,162,255,0.3)]"
                >
                  <span>Play on Roblox</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[10px] text-gray-400 text-center mt-1.5">
                  Launches Roblox Client or opens official experience page
                </p>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copied!' : 'Share Experience'}</span>
              </button>
            </div>

            {/* Technical Roblox Metadata Box */}
            <div className="w-full max-w-xs sm:max-w-sm lg:max-w-72 bg-[#161b21] border border-[#242d38] rounded-xl p-4 text-xs space-y-2.5 text-gray-400">
              <div className="flex justify-between border-b border-[#212933] pb-1.5">
                <span>Root Place ID:</span>
                <span className="font-mono text-gray-300 select-all">{game.rootPlaceId}</span>
              </div>
              <div className="flex justify-between border-b border-[#212933] pb-1.5">
                <span>Universe ID:</span>
                <span className="font-mono text-gray-300 select-all">{game.universeId}</span>
              </div>
              <div className="flex justify-between border-b border-[#212933] pb-1.5">
                <span>Genre:</span>
                <span className="font-medium text-gray-200">{game.genre}</span>
              </div>
              <div className="flex justify-between border-b border-[#212933] pb-1.5">
                <span>Active Players:</span>
                <span className="font-medium text-[#00E59B]">
                  {game.playerCount ? game.playerCount.toLocaleString() : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Visits:</span>
                <span className="font-medium text-gray-200">{game.totalVisits}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Title, Synopsis, Histogram, Reviews (PRD Section 6.2 #1) */}
          <div className="lg:col-span-8 space-y-7">
            {/* Title & Creator Header */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00E59B] mb-1">
                <span>{game.genre}</span>
                {game.releaseYear && <span>• {game.releaseYear}</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {game.name}
              </h1>
              <p className="text-sm text-gray-300 mt-1 flex items-center gap-2">
                <span>Developed by</span>
                <span className="font-bold text-white bg-[#1e2630] px-2.5 py-0.5 rounded-full border border-[#2b3542]">
                  {game.creatorName} ({game.creatorType})
                </span>
              </p>
            </div>

            {/* Synopsis / Description */}
            <div className="bg-[#181e24] border border-[#26313d] rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                Synopsis
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {game.description}
              </p>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[#232b35]">
                {game.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-gray-300 bg-[#14181c] border border-[#293440] px-2.5 py-1 rounded-md"
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
                      : game.rawVisits.toLocaleString())
                : (game.totalVisits || '0');

              const backlogsCount = userLogs.filter(l => l.gameId === game.id && l.status === 'backlog').length 
                + customLists.filter(cl => cl.items.some(it => it.gameId === game.id)).length;

              const favoritedDisplay = game.favoritedCount !== undefined 
                ? (game.favoritedCount >= 1_000_000 
                    ? `${(game.favoritedCount / 1_000_000).toFixed(1)}M`
                    : game.favoritedCount >= 1_000 
                      ? `${(game.favoritedCount / 1_000).toFixed(1)}K`
                      : game.favoritedCount.toLocaleString())
                : '0';

              const reviewsCount = gameReviews.length;

              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Aggregate Stats Cards */}
                  <div className="md:col-span-5 grid grid-cols-2 gap-3">
                    <div className="bg-[#181e24] border border-[#26313d] rounded-xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-400">Total Visits</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00E59B]/10 text-[#00E59B] border border-[#00E59B]/20">API</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Eye className="w-4 h-4 text-[#00E59B]" />
                        <span className="text-xl font-bold text-white tracking-tight">
                          {totalVisitsDisplay}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">Roblox Official</span>
                    </div>

                    <div className="bg-[#181e24] border border-[#26313d] rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-gray-400">In Backlogs</span>
                      <div className="flex items-center gap-2 mt-2">
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        <span className="text-xl font-bold text-white tracking-tight">
                          {backlogsCount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">Bloxboxd Lists</span>
                    </div>

                    <div className="bg-[#181e24] border border-[#26313d] rounded-xl p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-400">Favorited</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00A2FF]/10 text-[#00A2FF] border border-[#00A2FF]/20">API</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-[#00A2FF] fill-[#00A2FF]" />
                        <span className="text-xl font-bold text-white tracking-tight">
                          {favoritedDisplay}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">Roblox Favorites</span>
                    </div>

                    <div className="bg-[#181e24] border border-[#26313d] rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold text-gray-400">Reviews</span>
                      <div className="flex items-center gap-2 mt-2">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <span className="text-xl font-bold text-white tracking-tight">
                          {reviewsCount.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">Community Reviews</span>
                    </div>
                  </div>

                  {/* Rating Histogram (PRD Section 6.2 #1) */}
                  <div className="md:col-span-7">
                    <RatingHistogram
                      histogram={game.ratingHistogram}
                      totalCount={game.ratingCount}
                      averageRating={game.ratingAverage}
                      upVotes={game.upVotes}
                      downVotes={game.downVotes}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Community Reviews Section (PRD Section 6.2 #1) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26313d] pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Community Reviews
                  </h2>
                  <span className="text-xs font-semibold text-[#00E59B] bg-[#00E59B]/10 px-2 py-0.5 rounded-full">
                    {gameReviews.length}
                  </span>
                </div>

                {/* Filter and Log button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#181e24] border border-[#2b3542] rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setActiveReviewFilter('top')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        activeReviewFilter === 'top' 
                          ? 'bg-[#26323e] text-[#00E59B]' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Top Rated
                    </button>
                    <button
                      onClick={() => setActiveReviewFilter('recent')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                        activeReviewFilter === 'recent' 
                          ? 'bg-[#26323e] text-[#00E59B]' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Recent
                    </button>
                  </div>

                  <button
                    onClick={() => openLogModal(game)}
                    className="px-3 py-1.5 rounded-lg bg-[#222a33] hover:bg-[#2c3642] border border-[#303c4a] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00E59B]" />
                    <span>Write Review</span>
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
                        className="bg-[#181e24] border border-[#252f3b] rounded-xl p-4 transition-all"
                      >
                        {/* Reviewer Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={safeAvatarSrc(rev.userAvatar)}
                              alt={rev.username}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {rev.username}
                                </span>
                                {rev.rating && (
                                  <div className="flex items-center text-[#00E59B] text-xs font-bold">
                                    <Star className="w-3 h-3 fill-[#00E59B] mr-0.5" />
                                    <span>{rev.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {rev.loggedDate}
                              </span>
                            </div>
                          </div>

                          {/* Like & Comments buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => likeReview(rev.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                rev.isLiked 
                                  ? 'bg-rose-500/15 text-rose-400' 
                                  : 'bg-[#1e2630] text-gray-400 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{rev.likesCount || 0}</span>
                            </button>

                            <button
                              onClick={() => setActiveReviewComments(rev)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-[#1e2630] text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                              title="Lihat & Tulis Komentar"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{rev.commentsCount || 0}</span>
                            </button>

                            {/* Report review (PRD Section 7) */}
                            <button
                              onClick={() => handleReport(rev.id)}
                              title="Report inappropriate review"
                              className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Spoiler Mask or Normal Text */}
                        {rev.hasSpoilers && !isRevealed ? (
                          <div 
                            onClick={() => toggleSpoiler(rev.id)}
                            className="bg-[#1e242c] border border-dashed border-amber-500/40 rounded-lg p-3.5 cursor-pointer text-center hover:bg-[#242c36] transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>This review contains spoilers for {game.name}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 underline">
                              Click here to reveal
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {rev.reviewText}
                          </p>
                        )}

                        {isReported && (
                          <div className="mt-2 text-[10px] text-amber-400 bg-amber-500/10 p-1.5 rounded text-center">
                            Review has been reported to Bloxboxd moderators for review.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#181e24] border border-[#252f3b] rounded-xl text-gray-400 text-xs">
                  No written reviews yet for {game.name}. Be the first to leave your thoughts!
                </div>
              )}

              {/* Bottom Back to Catalog Action */}
              <div className="pt-6 border-t border-[#26313d] flex items-center justify-between">
                <button
                  onClick={backToCatalog}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b222a] hover:bg-[#252f3b] border border-[#2d3744] hover:border-[#00E59B] text-xs font-bold text-white transition-all cursor-pointer shadow-sm group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#00E59B] group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Catalog</span>
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Back to top ↑
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
