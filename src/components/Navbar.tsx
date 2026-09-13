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
  X,
  Loader2,
  Users,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Game, safeImgSrc, safeAvatarSrc, UserProfile } from '../types';
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
    setUrlImportModalOpen,
    setLoginModalOpen,
    setEditProfileModalOpen,
    logoutRobloxAccount,
    setActiveProfileTab,
    viewUserProfile,
    setSelectedUserId,
    language,
    setLanguage,
    t
  } = useApp();

  const [query, setQuery] = useState(searchQuery || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [apiResults, setApiResults] = useState<Game[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sync internal query input when global searchQuery changes from chips or resets
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Debounced live Roblox and Bloxboxd user search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setApiResults([]);
      setUserResults([]);
      setIsSearchingApi(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingApi(true);
        const [robloxRes, usersRes] = await Promise.all([
          fetch(`/api/roblox/search?q=${encodeURIComponent(q)}`).catch(() => null),
          fetch(`/api/users/search?q=${encodeURIComponent(q)}`).catch(() => null)
        ]);

        if (robloxRes && robloxRes.ok) {
          const json = await robloxRes.json();
          if (Array.isArray(json.results)) {
            setApiResults(json.results);
          }
        }

        if (usersRes && usersRes.ok) {
          const json = await usersRes.json();
          if (Array.isArray(json.users)) {
            setUserResults(json.users);
          }
        }
      } catch (err) {
        console.warn('Live search error:', err);
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

  const handleSelectUser = (userId: string) => {
    viewUserProfile(userId);
    setIsSearchOpen(false);
    setQuery('');
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
              aria-label={t('nav_search_placeholder')}
              placeholder={t('nav_search_placeholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                setIsSearchOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-[#1b222a] border border-[#2c3744] focus:border-[#00E59B] rounded-full text-white placeholder:text-gray-500 outline-none transition-all shadow-inner"
            />

            {/* Right Controls inside Search Bar: Clear Button */}
            {query && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <button 
                  onClick={() => {
                    setQuery('');
                    setSearchQuery('');
                    setApiResults([]);
                  }}
                  className="p-1 text-gray-400 hover:text-white rounded-full transition-colors text-xs"
                  title={language === 'id' ? 'Hapus ketikan' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

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
                    <span>{t('nav_url_detected')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}

              {/* Bloxboxd Users Section */}
              {userResults.length > 0 && (
                <div className="bg-[#151b22]">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#00E59B] uppercase tracking-wider bg-[#12161c] flex items-center justify-between border-b border-[#242e3a]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-[#00E59B]" />
                      {t('nav_users_section')} ({userResults.length})
                    </span>
                  </div>
                  <div className="divide-y divide-[#1e2632]">
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u.id)}
                        className="p-2.5 px-3.5 hover:bg-[#1f2834] cursor-pointer flex items-center gap-3 transition-colors group"
                      >
                        <img
                          src={safeAvatarSrc(u.avatarUrl)}
                          alt={u.username}
                          className="w-9 h-9 rounded-full object-cover bg-black/40 border border-white/10 group-hover:ring-2 group-hover:ring-[#00E59B] transition-all flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-white group-hover:text-[#00E59B] transition-colors truncate">
                              {u.displayName || u.username}
                            </p>
                            <span className="text-[10px] font-mono text-gray-400">@{u.handle || u.username}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">
                            {u.bio || (language === 'id' ? 'Pemain Roblox di Bloxboxd' : 'Roblox gamer on Bloxboxd')}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-[#00E59B] bg-[#00E59B]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {t('nav_view_profile')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {combinedResults.length > 0 ? (
                <div>
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-[#14181c] flex items-center justify-between">
                    <span>{t('nav_games_section')} ({combinedResults.length})</span>
                    {isSearchingApi && <span className="text-[#00E59B] text-[10px]">{t('nav_searching_live')}</span>}
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
                      <span>{t('nav_search_in_catalog_full', { query })}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                !isRobloxUrl && userResults.length === 0 && (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {isSearchingApi ? (
                      <span className="text-[#00E59B]">{t('nav_searching_servers')}</span>
                    ) : (
                      <div>
                        <p>{t('nav_no_instant_results', { query })}</p>
                        <button
                          onClick={() => handleCommitSearch()}
                          className="mt-2 text-xs font-bold text-[#00E59B] hover:underline"
                        >
                          {t('nav_search_catalog_btn')}
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
            title={t('nav_games')}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav_games')}</span>
          </button>

          {/* Curated Lists Tab */}
          <button
            onClick={() => { setActiveTab('lists'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'lists' || activeTab === 'list-detail'
                ? 'text-[#00A2FF] bg-[#00A2FF]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title={t('nav_lists')}
          >
            <ListOrdered className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav_lists')}</span>
          </button>

          {/* Diary Tab */}
          <button
            onClick={() => { setActiveTab('diary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'diary' 
                ? 'text-[#00E59B] bg-[#00E59B]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title={t('nav_diary')}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav_diary')}</span>
          </button>

          {/* Community Tab */}
          <button
            onClick={() => { setActiveTab('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'community' 
                ? 'text-[#a855f7] bg-[#a855f7]/10' 
                : 'text-gray-300 hover:text-white hover:bg-[#202730]'
            }`}
            title={t('nav_community')}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav_community')}</span>
          </button>

          {/* Tambah Game Button */}
          <button
            onClick={() => setUrlImportModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#00E59B]/10 hover:bg-[#00E59B]/20 border border-[#00E59B]/30 hover:border-[#00E59B] text-[#00E59B] text-xs font-bold transition-all shadow-sm group flex-shrink-0"
            title={language === 'id' ? 'Tambah game Roblox ke Bloxboxd via Link atau Place ID' : 'Add Roblox game to Bloxboxd via Link or Place ID'}
          >
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">{t('nav_add_game')}</span>
          </button>

          {/* Language Switcher Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#18212a] hover:bg-[#202c38] border border-[#2b3947] hover:border-[#00E59B]/50 text-xs font-bold transition-all text-gray-200 shadow-sm flex-shrink-0 cursor-pointer"
            title={language === 'id' ? 'Switch language to English' : 'Ganti bahasa ke Indonesia'}
          >
            <Globe className="w-3.5 h-3.5 text-[#00E59B]" />
            <span className="font-mono text-[10px] sm:text-[11px] font-black text-white">
              {language === 'id' ? 'ID' : 'EN'}
            </span>
          </button>

          {/* Exactly ONE Profile / Auth button next to Tambah Game */}
          {!user ? (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#00E59B] hover:bg-[#00c988] text-black font-extrabold text-xs transition-all shadow-md active:scale-95 whitespace-nowrap flex-shrink-0"
              title={language === 'id' ? 'Masuk akun Roblox asli' : 'Sign in with official Roblox account'}
            >
              <User className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">{t('nav_login_roblox')}</span>
              <span className="sm:hidden">{t('nav_login_short')}</span>
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
                        <ShieldCheck className="w-3 h-3" /> {t('nav_verified')}
                      </span>
                    )}
                  </div>

                  <div className="pt-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setSelectedUserId(null);
                        setActiveTab('profile');
                        setActiveProfileTab('overview');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <User className="w-3.5 h-3.5 text-[#00E59B]" />
                      <span>{t('nav_my_profile')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUserId(null);
                        setActiveTab('profile');
                        setActiveProfileTab('games');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#00A2FF]" />
                      <span>{t('nav_my_collection')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setLoginModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#00A2FF]" />
                      <span>{t('nav_switch_account')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditProfileModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span>{t('nav_edit_profile')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setLanguage(language === 'id' ? 'en' : 'id');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202732] rounded-xl transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-3.5 h-3.5 text-[#00E59B]" />
                        <span>{t('nav_lang_toggle')}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-[#00E59B]/10 text-[#00E59B] px-1.5 py-0.5 rounded">
                        {language === 'id' ? 'ID (Indonesia)' : 'EN (English)'}
                      </span>
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
                      <span>{t('nav_logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Search Bar */}
      <div ref={mobileSearchContainerRef} className="relative p-2.5 px-4 md:hidden border-t border-[#202731] bg-[#161a20]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            aria-label={t('nav_search_placeholder')}
            placeholder={t('nav_search_placeholder')}
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

        {/* Mobile Search Results Dropdown */}
        {isSearchOpen && query.trim().length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1.5 bg-[#181e24] border border-[#2b3644] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#242e3a] max-h-80 overflow-y-auto">
            {/* Mobile Users from Bloxboxd */}
            {userResults.length > 0 && (
              <div className="bg-[#151b22]">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#00E59B] uppercase tracking-wider bg-[#12161c] flex items-center justify-between border-b border-[#242e3a]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-[#00E59B]" />
                    {t('nav_users_section')} ({userResults.length})
                  </span>
                </div>
                <div className="divide-y divide-[#1e2632]">
                  {userResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className="p-2.5 px-3 hover:bg-[#1f2834] active:bg-[#1f2834] cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={safeAvatarSrc(u.avatarUrl)}
                        alt={u.username}
                        className="w-8 h-8 rounded-full object-cover bg-black/40 border border-white/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-white truncate">{u.displayName || u.username}</p>
                          <span className="text-[10px] text-gray-400 font-mono">@{u.handle || u.username}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{u.bio || (language === 'id' ? 'Pemain Roblox di Bloxboxd' : 'Roblox gamer on Bloxboxd')}</p>
                      </div>
                      <span className="text-[10px] text-[#00E59B] bg-[#00E59B]/10 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                        {t('nav_view_profile')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {combinedResults.length > 0 ? (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-[#14181c] flex items-center justify-between">
                  <span>{t('nav_games_section')} ({combinedResults.length})</span>
                  {isSearchingApi && <span className="text-[#00E59B] text-[10px]">{t('nav_searching_live')}</span>}
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
                  <span>{t('nav_search_in_catalog', { query })}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              userResults.length === 0 && (
                <div className="p-3 text-center text-xs text-gray-400">
                  {isSearchingApi ? t('nav_searching_servers') : t('nav_no_instant_results', { query })}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </header>
  );
};
