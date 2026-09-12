import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value?: number; // 0.5 to 5.0
  onChange?: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showText?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value = 0,
  onChange,
  size = 'md',
  readonly = false,
  showText = false
}) => {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const displayVal = hoverVal !== null ? hoverVal : value;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const getRatingLabel = (val: number) => {
    if (val <= 0) return 'No rating';
    if (val <= 1.0) return `${val} ★ Half-baked`;
    if (val <= 2.0) return `${val} ★ Mediocre`;
    if (val <= 3.0) return `${val} ★ Decent`;
    if (val <= 4.0) return `${val} ★ Great`;
    if (val < 5.0) return `${val} ★ Amazing`;
    return `${val} ★ Masterpiece!`;
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div 
        className={`flex items-center ${readonly ? '' : 'cursor-pointer'}`}
        onMouseLeave={() => !readonly && setHoverVal(null)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const fullScore = starIndex;
          const halfScore = starIndex - 0.5;

          const isFull = displayVal >= fullScore;
          const isHalf = !isFull && displayVal >= halfScore;

          return (
            <div
              key={starIndex}
              className="relative p-0.5"
              onClick={(e) => {
                if (readonly || !onChange) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const isLeftHalf = clickX < rect.width / 2;
                onChange(isLeftHalf ? halfScore : fullScore);
              }}
              onMouseMove={(e) => {
                if (readonly) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const isLeftHalf = mouseX < rect.width / 2;
                setHoverVal(isLeftHalf ? halfScore : fullScore);
              }}
            >
              {/* Background empty star */}
              <Star
                className={`${starSizes[size]} text-[#2c343d] transition-colors`}
                fill="#1c2228"
              />

              {/* Half Star Fill */}
              {isHalf && (
                <div className="absolute inset-0 p-0.5 overflow-hidden w-1/2 pointer-events-none">
                  <Star
                    className={`${starSizes[size]} text-[#00E59B] drop-shadow-[0_0_8px_rgba(0,229,155,0.4)]`}
                    fill="#00E59B"
                  />
                </div>
              )}

              {/* Full Star Fill */}
              {isFull && (
                <div className="absolute inset-0 p-0.5 pointer-events-none">
                  <Star
                    className={`${starSizes[size]} text-[#00E59B] drop-shadow-[0_0_8px_rgba(0,229,155,0.4)]`}
                    fill="#00E59B"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showText && (
        <span className="text-xs font-semibold tracking-wide text-[#00E59B]">
          {getRatingLabel(displayVal)}
        </span>
      )}
    </div>
  );
};
