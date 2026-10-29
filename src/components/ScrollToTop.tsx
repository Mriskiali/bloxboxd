import { useApp } from '../context/AppContext';
import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const { t } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Tampilkan tombol saat pengguna telah scroll ke bawah lebih dari 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title={t('scroll_top')}
      className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-30 p-2 sm:p-2.5 rounded-full bg-panel/90 text-ink hover:text-black hover:bg-green border border-line hover:border-green shadow-[0_6px_20px_rgba(0,0,0,0.6)] backdrop-blur-xs transition-colors duration-300 transform cursor-pointer group flex items-center justify-center ${
        isVisible 
          ? 'opacity-85 hover:opacity-100 translate-y-0 scale-90 sm:scale-100 pointer-events-auto hover:scale-110 active:scale-95' 
          : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
    </button>
  );
};
