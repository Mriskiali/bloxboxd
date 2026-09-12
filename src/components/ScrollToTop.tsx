import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
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
      title="Kembali ke atas"
      className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#182029]/95 text-gray-300 hover:text-black hover:bg-[#00E59B] border border-[#2d3a49] hover:border-[#00E59B] shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 transform cursor-pointer group flex items-center justify-center ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto hover:scale-110 active:scale-95' 
          : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
    </button>
  );
};
