import React from 'react';

interface BloxboxdLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BloxboxdLogo: React.FC<BloxboxdLogoProps> = ({ 
  className = '',
  size = 'md' 
}) => {
  const dimension = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7 sm:w-8 sm:h-8';

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${dimension} ${className}`}>
      <svg 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_10px_rgba(0,229,155,0.4)] group-hover:scale-105 transition-transform duration-300"
      >
        {/* Ambient Glow */}
        <circle cx="32" cy="30" r="18" fill="#00E59B" fillOpacity="0.2" />

        {/* Isometric Blox Cube */}
        {/* Top Face (Emerald Green) */}
        <path d="M32 11L52 22.5L32 34L12 22.5Z" fill="#00E59B" />
        
        {/* Left Face (Electric Cyan/Blue) */}
        <path d="M12 22.5L32 34V53.5L12 42Z" fill="#00A2FF" />
        
        {/* Right Face (Deep Shadow Emerald) */}
        <path d="M32 34L52 22.5V42L32 53.5Z" fill="#007a52" />

        {/* 3D Raised Blox Stud */}
        <path d="M24 19.5L32 24.1V27.1L24 22.5Z" fill="#008a5c" />
        <path d="M32 24.1L40 19.5V22.5L32 27.1Z" fill="#00573a" />
        <path d="M32 14.9L40 19.5L32 24.1L24 19.5Z" fill="#E8FFF7" />
      </svg>
    </div>
  );
};
