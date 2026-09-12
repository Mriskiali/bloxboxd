import React from 'react';

interface GameCardSkeletonProps {
  layout?: 'grid' | 'compact';
}

export const GameCardSkeleton: React.FC<GameCardSkeletonProps> = ({ layout = 'grid' }) => {
  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#181e24] border border-[#26313d] overflow-hidden">
        {/* Thumbnail skeleton */}
        <div className="w-12 h-12 rounded-md animate-shimmer flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title line */}
          <div className="h-3.5 w-3/4 rounded-md animate-shimmer" />
          {/* Creator line */}
          <div className="h-2.5 w-1/2 rounded-md animate-shimmer" />
        </div>
        {/* Rating badge */}
        <div className="w-10 h-4 rounded-md animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl bg-[#181e24] border border-[#252f3b] overflow-hidden shadow-sm">
      {/* Poster Image Skeleton (1:1 aspect ratio) */}
      <div className="relative aspect-square w-full animate-shimmer overflow-hidden">
        {/* Badges placeholder at top */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="h-4 w-16 rounded-full bg-black/40 backdrop-blur-xs" />
          <div className="h-4 w-12 rounded-full bg-black/40 backdrop-blur-xs" />
        </div>
      </div>

      {/* Card Body Skeleton */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-[#151b21] space-y-3">
        <div className="space-y-2">
          {/* Game Title line */}
          <div className="h-4 w-4/5 rounded-md animate-shimmer" />
          {/* Creator Name & release line */}
          <div className="h-3 w-1/2 rounded-md animate-shimmer" />
        </div>

        {/* Bottom stats row */}
        <div className="pt-2 border-t border-[#222a34] flex items-center justify-between">
          <div className="h-3 w-14 rounded-md animate-shimmer" />
          <div className="h-3 w-12 rounded-md animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

interface GameGridSkeletonProps {
  count?: number;
  layout?: 'grid' | 'compact';
  className?: string;
}

export const GameGridSkeleton: React.FC<GameGridSkeletonProps> = ({ 
  count = 10, 
  layout = 'grid',
  className = ''
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (layout === 'compact') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {items.map(idx => (
          <GameCardSkeleton key={`skeleton-compact-${idx}`} layout="compact" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 ${className}`}>
      {items.map(idx => (
        <GameCardSkeleton key={`skeleton-grid-${idx}`} layout="grid" />
      ))}
    </div>
  );
};
