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

const compactCount = (n?: number, locale = 'id-ID'): string => {
  if (!n || n <= 0) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')}k`;
  return n.toLocaleString(locale);
};

/**
 * Poster-first card. No container box, no gradient scrim, no pill badges:
 * the poster carries the image, the caption carries the data, and the only
 * colour is the rating star and the single "Log" action on hover.
 */
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
      <button
        onClick={() => viewGame(game.id)}
        className="group flex w-full items-center gap-3 border-b border-line-soft py-2 text-left last:border-0"
      >
        <img
          src={safeImgSrc(game.iconUrl)}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_ICON_URL) e.currentTarget.src = DEFAULT_ICON_URL;
          }}
          className="h-9 w-9 shrink-0 rounded-[2px] border border-line object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink group-hover:text-white">
            {game.name}
          </span>
          <span className="block truncate text-[11px] text-faint">
            {game.creatorName}
            {game.playerCount ? ` · ${compactCount(game.playerCount, language === 'id' ? 'id-ID' : 'en-US')} ${t('card_online')}` : ''}
          </span>
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-orange">
          <Star className="h-3 w-3 fill-orange" strokeWidth={0} />
          {game.ratingAverage.toFixed(1)}
        </span>
      </button>
    );
  }

  return (
    <article className="group relative">
      <div
        onClick={() => viewGame(game.id)}
        className="bb-poster cursor-pointer group-hover:border-line"
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && viewGame(game.id)}
      >
        <img
          src={safeImgSrc(game.iconUrl)}
          alt={game.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_ICON_URL) e.currentTarget.src = DEFAULT_ICON_URL;
          }}
          className="group-hover:brightness-110"
        />

        {/* Status marker: a flat icon chip, not a coloured pill */}
        {userLog && (
          <span
            className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-[2px] bg-bg/90 text-ink"
            title={isPlayed ? t('card_played') : isPlaying ? t('card_playing') : t('card_backlog')}
          >
            {isPlayed && <Eye className="h-3 w-3" strokeWidth={2.25} />}
            {isPlaying && <span className="h-1.5 w-1.5 rounded-full bg-blue" />}
            {isBacklog && <Bookmark className="h-3 w-3" strokeWidth={2.25} />}
          </span>
        )}

        {/* Hover actions: flat strip, hairline top, three small buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 flex items-stretch border-t border-line bg-bg/95 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100"
        >
          <button
            onClick={() => toggleGameStatus(game.id, 'played')}
            title={isPlayed ? t('card_marked_played') : t('card_mark_played')}
            className={`flex h-7 flex-1 items-center justify-center border-r border-line text-[10px] font-semibold uppercase tracking-[0.08em] ${
              isPlayed ? 'text-green' : 'text-muted hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toggleGameStatus(game.id, 'backlog')}
            title={isBacklog ? t('card_in_backlog') : t('card_add_backlog')}
            className={`flex h-7 flex-1 items-center justify-center border-r border-line text-[10px] font-semibold uppercase tracking-[0.08em] ${
              isBacklog ? 'text-blue' : 'text-muted hover:text-white'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toggleLike(game.id)}
            title={isLiked ? t('card_liked') : t('card_like')}
            className={`flex h-7 flex-1 items-center justify-center border-r border-line ${
              isLiked ? 'text-orange' : 'text-muted hover:text-white'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-orange' : ''}`} />
          </button>
          <button
            onClick={() => openLogModal(game)}
            title={t('detail_log_review')}
            className="flex h-7 flex-[1.4] items-center justify-center gap-1 bg-green text-[10px] font-bold uppercase tracking-[0.08em] text-bg hover:bg-green"
          >
            <Plus className="h-3 w-3" strokeWidth={3} />
            {t('card_log_btn')}
          </button>
        </div>
      </div>

      {/* Caption: title, meta line, rating. No box, no border. */}
      <div className="mt-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            onClick={() => viewGame(game.id)}
            className="block max-w-full truncate text-left text-[13px] font-semibold leading-snug text-ink hover:text-white"
            title={game.name}
          >
            {game.name}
          </button>
          <p className="mt-[3px] truncate text-[11px] leading-snug text-faint">
            {game.releaseYear || '—'}
            {game.genre ? ` · ${game.genre}` : ''}
            {game.playerCount ? ` · ${compactCount(game.playerCount, language === 'id' ? 'id-ID' : 'en-US')} ${t('card_online')}` : ''}
          </p>
        </div>
        <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[11px] font-semibold text-orange">
          <Star className="h-3 w-3 fill-orange" strokeWidth={0} />
          {game.ratingAverage.toFixed(1)}
        </span>
      </div>
    </article>
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
