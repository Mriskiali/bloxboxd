import React, { memo } from 'react';
import { Eye, Bookmark, Heart, Star, Plus } from 'lucide-react';
import { Game, GameLog, safeImgSrc, DEFAULT_ICON_URL } from '../types';
import { useApp } from '../context/AppContext';

interface GameCardProps {
  game: Game;
  layout?: 'grid' | 'compact' | 'featured';
  userLog?: GameLog | null;
  priority?: boolean;
}

const GameCardComponent: React.FC<GameCardProps> = ({ game, layout = 'grid', userLog: propUserLog, priority = false }) => {
  const { viewGame, getUserLogForGame, toggleGameStatus, toggleLike, openLogModal, language, t } = useApp();
  const userLog = propUserLog !== undefined ? propUserLog : getUserLogForGame(game.id);

  const isPlayed = userLog?.status === 'played';
  const isBacklog = userLog?.status === 'backlog';
  const isPlaying = userLog?.status === 'playing';
  const isLiked = !!userLog?.isLiked;
  const userRating = userLog?.rating;

  if (layout === 'compact') {
    return (
      <div 
        onClick={() => viewGame(game.id)}
        className="group flex items-center gap-3 p-2.5 rounded-lg bg-[#1a2026] hover:bg-[#222a33] border border-[#26303b] cursor-pointer transition-all duration-200"
      >
        <img 
          src={safeImgSrc(game.iconUrl)} 
          alt={game.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_ICON_URL) {
              e.currentTarget.src = DEFAULT_ICON_URL;
            }
          }}
          className="w-12 h-12 rounded-md object-cover flex-shrink-0 group-hover:scale-105 transition-transform" 
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white truncate group-hover:text-[#00E59B] transition-colors">
            {game.name}
          </h4>
          <p className="text-xs text-gray-400 truncate">{game.creatorName}</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#00E59B]">
          <Star className="w-3.5 h-3.5 fill-[#00E59B]" />
          <span>{game.ratingAverage.toFixed(1)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col rounded-xl bg-[#181e24] border border-[#26313d] hover:border-[#00E59B]/50 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      {/* Poster Image (Square 1:1) */}
      <div 
        onClick={() => viewGame(game.id)}
        className="relative aspect-square w-full overflow-hidden bg-[#111418] cursor-pointer"
      >
        <img
          src={safeImgSrc(game.iconUrl)}
          alt={game.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_ICON_URL) {
              e.currentTarget.src = DEFAULT_ICON_URL;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Subtle dark gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges: User Status & Star Rating */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {/* Active Shelf Status Badge */}
          {userLog && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-md ${
              isPlayed ? 'bg-[#00E59B]/90 text-black' :
              isPlaying ? 'bg-[#00A2FF]/90 text-white' :
              isBacklog ? 'bg-amber-400/90 text-black' :
              'bg-gray-700/80 text-gray-200'
            }`}>
              {isPlayed && <Eye className="w-3 h-3" />}
              {isPlaying && t('card_playing')}
              {isBacklog && t('card_backlog')}
              {isPlayed && t('card_played')}
            </span>
          )}

          {!userLog && (
            <span className="text-[11px] font-medium text-gray-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full truncate max-w-[140px]" title={game.subgenre && game.subgenre !== game.genre ? `${game.genre} • ${game.subgenre}` : game.genre}>
              {game.genre}{game.subgenre && game.subgenre !== game.genre ? ` • ${game.subgenre}` : ''}
            </span>
          )}

          {/* Average Rating Pill */}
          <div className="flex items-center gap-1 text-[11px] font-bold bg-black/75 backdrop-blur-md text-[#00E59B] px-2 py-0.5 rounded-full border border-white/10 shadow">
            <Star className="w-3 h-3 fill-[#00E59B]" />
            <span>{game.ratingAverage.toFixed(1)}</span>
          </div>
        </div>

        {/* Hover Quick Actions Bar (Bottom of poster) */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0"
        >
          {/* Quick Played Toggle */}
          <button
            onClick={() => toggleGameStatus(game.id, 'played')}
            title={isPlayed ? t('card_marked_played') : t('card_mark_played')}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              isPlayed 
                ? 'bg-[#00E59B] text-black shadow-[0_0_12px_rgba(0,229,155,0.4)]' 
                : 'bg-[#181e24]/90 text-gray-300 hover:text-white hover:bg-[#232c36]'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Quick Backlog Toggle */}
          <button
            onClick={() => toggleGameStatus(game.id, 'backlog')}
            title={isBacklog ? t('card_in_backlog') : t('card_add_backlog')}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              isBacklog 
                ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]' 
                : 'bg-[#181e24]/90 text-gray-300 hover:text-white hover:bg-[#232c36]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Quick Like Toggle */}
          <button
            onClick={() => toggleLike(game.id)}
            title={isLiked ? t('card_liked') : t('card_like')}
            className={`p-2 rounded-lg backdrop-blur-md transition-all ${
              isLiked 
                ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]' 
                : 'bg-[#181e24]/90 text-gray-300 hover:text-white hover:bg-[#232c36]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
          </button>

          {/* Open Detailed Log Modal */}
          <button
            onClick={() => openLogModal(game)}
            title={t('detail_log_review')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#00A2FF] text-white hover:bg-[#0090e3] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,162,255,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('card_log_btn')}</span>
          </button>
        </div>
      </div>

      {/* Card Body Details */}
      <div 
        onClick={() => viewGame(game.id)} 
        className="p-3.5 cursor-pointer flex flex-col justify-between flex-1 bg-[#161c22]"
      >
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#00E59B] transition-colors line-clamp-1">
            {game.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-0.5">
            {game.creatorName} {game.releaseYear ? `• ${game.releaseYear}` : ''}
          </p>
        </div>

        {/* User's logged rating if recorded */}
        <div className="mt-2 pt-1.5 sm:mt-2.5 sm:pt-2 border-t border-[#232b35] flex items-center justify-between text-xs">
          {userRating ? (
            <div className="flex items-center gap-1 text-[#00E59B] font-bold">
              <Star className="w-3 h-3 fill-[#00E59B]" />
              <span className="text-[10px] sm:text-xs">{t('card_you_rated')} {userRating.toFixed(1)} ★</span>
            </div>
          ) : (
            <span className="text-gray-300 text-[10px] sm:text-[11px] font-mono">
              {game.playerCount ? `${(game.playerCount).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')} ${t('card_online')}` : t('card_active')}
            </span>
          )}

          <span className="text-gray-300 text-[10px] sm:text-[11px]">
            {game.totalVisits || '0'} {t('card_visits')}
          </span>
        </div>
      </div>
    </div>
  );
};

export const GameCard = memo(GameCardComponent, (prevProps, nextProps) => {
  if (prevProps.layout !== nextProps.layout) return false;
  if (prevProps.game.id !== nextProps.game.id) return false;
  if (prevProps.game.ratingAverage !== nextProps.game.ratingAverage) return false;
  if (prevProps.game.playerCount !== nextProps.game.playerCount) return false;
  if (prevProps.game.totalVisits !== nextProps.game.totalVisits) return false;
  if (prevProps.game.name !== nextProps.game.name) return false;
  if (prevProps.game.genre !== nextProps.game.genre) return false;
  if (prevProps.game.subgenre !== nextProps.game.subgenre) return false;
  if (prevProps.game.iconUrl !== nextProps.game.iconUrl) return false;
  if (prevProps.userLog?.status !== nextProps.userLog?.status) return false;
  if (prevProps.userLog?.rating !== nextProps.userLog?.rating) return false;
  if (prevProps.userLog?.isLiked !== nextProps.userLog?.isLiked) return false;
  return true;
});
