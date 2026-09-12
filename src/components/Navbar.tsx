import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Link as LinkIcon, 
  BookOpen, 
  ListOrdered, 
  Calendar, 
  User, 
  Compass, 
  Plus, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Settings,
  ShieldCheck,
  LogOut,
  SlidersHorizontal,
  X,
  Loader2,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Game, safeImgSrc, safeAvatarSrc } from '../types';
import { SearchFilterModal } from './SearchFilterModal';
import { BloxboxdLogo } from './BloxboxdLogo';

export const Navbar: React.FC = () => {
  const { 
    games, 
    user, 
    activeTab, 
    setActiveTab, 
    viewGame, 
    searchQuery,
    setSearchQuery,
    selectedGenre,
    sortBy,
    minRating,
    minPlayers,
    setUrlImportModalOpen,
    setLoginModalOpen,
    setEditProfileModalOpen,
    logoutRobloxAccount,
    setActiveProfileTab
  } = useApp();

  const [query, setQuery] = useState(searchQuery || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [apiResults, setApiResults] = useState<Game[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sync internal query input when global searchQuery changes from chips or resets
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Active filters count
  const activeFiltersCount = 
    (selectedGenre !== 'All' ? 1 : 0) +
    (sortBy !== 'popular' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minPlayers > 0 ? 1 : 0);

  // Debounced live Roblox API search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setApiResults([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingApi(true);
        const res = await fetch(`/api/roblox/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.results)) {
            setApiResults(json.results);
          }
        }
      } catch (err) {
        console.warn('Live Roblox search error:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Local match from current catalog
  const localResults = query.trim()
    ? games.filter(g => {
        const q = query.toLowerCase().trim();
        const nameMatch = g.name.toLowerCase().includes(q);
        const creatorMatch = g.creatorName?.toLowerCase().includes(q);
        const genreMatch = g.genre?.toLowerCase().includes(q);
        const tagMatch = Array.isArray(g.tags) && g.tags.some(t => t.toLowerCase().includes(q));
        const placeMatch = g.rootPlaceId?.toString().includes(q) || g.universeId?.toString().includes(q);
        return nameMatch || creatorMatch || genreMatch || tagMatch || placeMatch;
      })
    : [];

  // Merge local & API results deduplicated by ID / universeId
  const combinedResults: Game[] = (() => {
    if (!query.trim()) return [];
    const map = new Map<string, Game>();
    localResults.forEach(g => map.set(g.id, g));
    apiResults.forEach(g => {
      if (!map.has(g.id) && !Array.from(map.values()).some(existing => existing.universeId === g.universeId)) {
        map.set(g.id, g);
      }
    });
    return Array.from(map.values()).slice(0, 7);
  })();

  const isRobloxUrl = query.includes('roblox.com') || /^\d{6,}$/.test(query.trim());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        searchContainerRef.current && !searchContainerRef.current.contains(target) &&
        mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
        setIsFilterModalOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectGame = (game: Game) => {
    viewGame(game.id, game);
    setIsSearchOpen(false);
  };

  const handleCommitSearch = (textOverride?: string) => {
    const targetText = textOverride !== undefined ? textOverride : query;
    setSearchQuery(targetText.trim());
    setActiveTab('catalog');
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommitSearch();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#14181c]/95 backdrop-blur-md border-b border-[#232b35]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
        <div 
          onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          {/* Authentic Bloxboxd 3D Blox Cube Icon */}
          <BloxboxdLogo size="md" />
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-white font-mono flex items-center">
              BLOX<span className="text-[#00E59B]">BOXD</span>
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-400 font-semibold -mt-1">
              Roblox Catalog & Log
            </span>
          </div>
        </div>

        {/* Global Unified Search Bar with Filter Button (Desktop) */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-lg hidden md:block">
          <div className="relative flex items-center">
            {/* Search Icon / Indicator */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
              {isSearchingApi ? (
                <Loader2 className="w-4 h-4 text-[#00E59B] animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Input field */}
            <input
              type="text"
              aria-label="Cari game Roblox, creator, atau place ID"
              placeholder="Cari judul game Roblox, creator, ID..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearchOpen(true);
                setIsFilterModalOpen(false);
              }}
              onFocus={() => {
                setIsSearchOpen(true);
                setIsFilterModalOpen(false);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm bg-[#1b222a] border border-[#2c3744] focus:border-[#00E59B] rounded-full text-white placeholder:text-gray-500 outline-none transition-all shadow-inner"
            />

            {/* Right Controls inside Search Bar: Clear & Filter Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button 
                  onClick={() => {
                    setQuery('');
                    setSearchQuery('');
                    setApiResults([]);
                  }}
                  className="p-1 text-gray-400 hover:text-white rounded-full transition-colors text-xs"
                  title="Hapus ketikan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Integrated Filter Button */}
              <button
                type="button"
                onClick={() => {
                  setIsFilterModalOpen(!isFilterModalOpen);
                  setIsSearchOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFiltersCount > 0
                    ? 'bg-[#00E59B] text-black shadow-[0_0_10px_rgba(0,229,155,0.4)]'
                    : isFilterModalOpen
                      ? 'bg-[#00E59B]/20 text-[#00E59B] border border-[#00E59B]/50'
                      : 'bg-[#26303d] text-gray-300 hover:text-white hover:bg-[#303c4c]'
                }`}
                title="Buka Filter & Urutkan Game"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-black text-[#00E59B] text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Filter Dropdown Popover (Anchored right under Search Bar) */}
          {isFilterModalOpen && (
            <SearchFilterModal 
              isOpen={isFilterModalOpen} 
              onClose={() => setIsFilterModalOpen(false)}
              onApply={() => {
                handleCommitSearch();
              }}
              variant="popover"
            />
          )}

          {/* Autocomplete / Live Search Results Dropdown */}
          {isSearchOpen && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#181e24] border border-[#2b3644] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#242e3a]">
              {/* Option to import by URL if detected */}
              {isRobloxUrl && (
                <div 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setUrlImportModalOpen(true);
                  }}
                  className="p-3 bg-[#00E59B]/10 hover:bg-[#00E59B]/20 cursor-pointer flex items-center justify-between text-xs text-[#00E59B] font-semibold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <span>Roblox link / Place ID terdeteksi: Ambil data resmi & Buka Langsung!</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}

              {combinedResults.length > 0 ? (
                <div>
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-[#14181c] flex items-center justify-between">
                    <span>Hasil Pencarian ({combinedResults.length})</span>
                    {isSearchingApi && <span className="text-[#00E59B] text-[10px]">Mencari live Roblox API...</span>}
                  </div>
                  {combinedResults.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className="p-2.5 px-3.5 hover:bg-[#202730] cursor-pointer flex items-center gap-3 transition-colors group"
                    >
                      <img 
                        src={safeImgSrc(game.iconUrl)} 
                        alt={game.name} 
                        className="w-10 h-10 rounded-xl object-cover bg-black/40 flex-shrink-0 border border-white/5 group-hover:border-[#00E59B]/50 transition-colors" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[#00E59B] transition-colors">{game.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 truncate">
                          <span>{game.creatorName}</span>
                          <span>•</span>
                          <span className="text-[#00E59B] font-bold">{game.ratingAverage?.toFixed(1) || '4.0'} ★</span>
                          {game.playerCount ? (
                            <>
                              <span>•</span>
                              <span className="text-gray-300">👥 {game.playerCount > 1000 ? `${(game.playerCount / 1000).toFixed(1)}K` : game.playerCount}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 bg-[#252f3a] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {game.genre}
                      </span>
                    </div>
                  ))}

                  {/* Footer Action: Search All in Catalog */}
                  <div 
                    onClick={() => handleCommitSearch()}
                    className="p-3 bg-[#161c22] hover:bg-[#1e2630] cursor-pointer border-t border-[#252f3c] flex items-center justify-between text-xs text-[#00E59B] font-bold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" />
                      <span>Tekan Enter atau klik di sini untuk mencari "{query}" di seluruh katalog</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                !isRobloxUrl && (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {isSearchingApi ? (
                      <span className="text-[#00E59B]">Mencari di official server Roblox...</span>
                    ) : (
                      <div>
                        <p>Tidak ada hasil instan untuk "{query}".</p>
                        <button
                          onClick={() => handleCommitSearch()}
                          className="mt-2 text-xs font-bold text-[#00E59B] hover:underline"
                        >
                          Cari "{query}" di katalog & server Roblox ➔
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Catalog Tab */}
          <button
            onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'catalog' 
                ? 'text-[#00E59B] bg-[#00E59B]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title="Experiences"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Experiences</span>
          </button>

          {/* Curated Lists Tab */}
          <button
            onClick={() => { setActiveTab('lists'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'lists' || activeTab === 'list-detail'
                ? 'text-[#00A2FF] bg-[#00A2FF]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title="Lists"
          >
            <ListOrdered className="w-4 h-4" />
            <span className="hidden sm:inline">Lists</span>
          </button>

          {/* Diary Tab */}
          <button
            onClick={() => { setActiveTab('diary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'diary' 
                ? 'text-[#00E59B] bg-[#00E59B]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title="Diary"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Diary</span>
          </button>

          {/* Community Tab */}
          <button
            onClick={() => { setActiveTab('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'community' 
                ? 'text-[#a855f7] bg-[#a855f7]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title="Community"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Community</span>
          </button>

          {/* Tambah Game Button */}
          <button
            onClick={() => setUrlImportModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#00E59B]/10 hover:bg-[#00E59B]/20 border border-[#00E59B]/30 hover:border-[#00E59B] text-[#00E59B] text-xs font-bold transition-all shadow-sm group flex-shrink-0"
            title="Tambah game Roblox ke Bloxboxd via Link atau Place ID"
          >
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Tambah Game</span>
          </button>

          {/* Exactly ONE Profile / Auth button next to Tambah Game */}
          {!user ? (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs transition-all shadow-md active:scale-95 whitespace-nowrap flex-shrink-0"
              title="Masuk akun Roblox asli"
            >
              <User className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Masuk Roblox</span>
              <span className="sm:hidden">Masuk</span>
            </button>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all ${
                  activeTab === 'profile' || profileMenuOpen
                    ? 'border-[#00E59B] bg-[#1a222a]'
                    : 'border-[#2c3744] hover:border-gray-500 bg-[#161d24]'
                }`}
              >
                <img
                  src={safeAvatarSrc(user.avatarUrl)}
                  alt={user.displayName}
                  className="w-6 h-6 rounded-full object-cover bg-black/40 border border-white/10"
                />
                <span className="text-xs font-bold text-white max-w-[90px] truncate hidden sm:inline">
                  {user.displayName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#181f27] border border-[#2c3846] rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 divide-y divide-[#242d38]">
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-gray-400 truncate font-mono">@{user.username}</p>
                    {user.isVerifiedOwner && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#00E59B] bg-[#00E59B]/10 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Akun Terverifikasi
                      </span>
                    )}
                  </div>

                  <div className="pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setActiveProfileTab('overview');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <User className="w-3.5 h-3.5 text-[#00E59B]" />
                      <span>Lihat Profil Saya</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setActiveProfileTab('games');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#00A2FF]" />
                      <span>Koleksi Game & Backlog</span>
                    </button>

                    <button
                      onClick={() => {
                        setLoginModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00A2FF]" />
                      <span>Ganti / Hubungkan Akun</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditProfileModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span>Edit Bio & 4 Favorit</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        logoutRobloxAccount();
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Putuskan Akun Roblox</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Search Bar & Integrated Filter Button */}
      <div ref={mobileSearchContainerRef} className="relative p-2.5 px-4 md:hidden border-t border-[#202731] bg-[#161a20]">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              aria-label="Cari game Roblox"
              placeholder="Cari game Roblox, creator, ID..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#1b222a] border border-[#2c3744] focus:border-[#00E59B] rounded-xl text-white outline-none transition-colors"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchQuery('');
                  setApiResults([]);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => {
              setIsFilterModalOpen(!isFilterModalOpen);
              setIsSearchOpen(false);
            }}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeFiltersCount > 0
                ? 'bg-[#00E59B] text-black border-[#00E59B]'
                : isFilterModalOpen
                  ? 'bg-[#00E59B]/20 text-[#00E59B] border-[#00E59B]/50'
                  : 'bg-[#1b222a] border-[#2c3744] text-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-black text-[#00E59B] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Search Results Dropdown */}
        {isSearchOpen && query.trim().length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1.5 bg-[#181e24] border border-[#2b3644] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#242e3a] max-h-80 overflow-y-auto">
            {combinedResults.length > 0 ? (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-[#14181c] flex items-center justify-between">
                  <span>Hasil ({combinedResults.length})</span>
                  {isSearchingApi && <span className="text-[#00E59B] text-[10px]">Mencari live...</span>}
                </div>
                {combinedResults.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className="p-2.5 px-3 hover:bg-[#202730] active:bg-[#202730] cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={safeImgSrc(game.iconUrl)}
                      alt={game.name}
                      className="w-9 h-9 rounded-xl object-cover bg-black/40 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{game.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {game.creatorName} • <span className="text-[#00E59B]">{game.ratingAverage?.toFixed(1) || '4.0'} ★</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-[#252f3a] px-2 py-0.5 rounded">
                      {game.genre}
                    </span>
                  </div>
                ))}

                <div 
                  onClick={() => handleCommitSearch()}
                  className="p-2.5 bg-[#161c22] text-[#00E59B] text-xs font-bold flex items-center justify-between border-t border-[#252f3c]"
                >
                  <span>Cari "{query}" di katalog</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-gray-400">
                {isSearchingApi ? 'Mencari di server Roblox...' : `Tidak ada hasil untuk "${query}"`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filter Modal (safely padded, never clipped) */}
      <div className="md:hidden">
        {isFilterModalOpen && (
          <SearchFilterModal 
            isOpen={isFilterModalOpen} 
            onClose={() => setIsFilterModalOpen(false)}
            onApply={() => {
              handleCommitSearch();
            }}
            variant="modal"
          />
        )}
      </div>
    </header>
  );
};
