import React from 'react';

interface BloxboxdLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Flat mark: three blocks in a triad — the Letterboxd dot geometry rebuilt
 * from squares, which is the product's own vocabulary (Roblox is blocks).
 * No glow, no gradient, no 3D bevel: the mark has to survive at 20px.
 */
export const BloxboxdLogo: React.FC<BloxboxdLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const dimension = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-9 h-9' : 'w-6 h-6 sm:w-7 sm:h-7';

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${dimension} ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="6" y="34" width="22" height="22" rx="2" fill="#ff8000" />
        <rect x="21" y="6" width="22" height="22" rx="2" fill="#00e054" />
        <rect x="36" y="34" width="22" height="22" rx="2" fill="#40bcf4" />
      </svg>
    </div>
  );
};
