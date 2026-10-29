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

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

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
          if (Array.isArray(json.results)) setApiResults(json.results);
        }

        if (usersRes && usersRes.ok) {
          const json = await usersRes.json();
          if (Array.isArray(json.users)) setUserResults(json.users);
        }
      } catch (err) {
        console.warn('Live search error:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const localResults = query.trim()
    ? games.filter(g => {
        const q = query.toLowerCase().trim();
        return (
          g.name.toLowerCase().includes(q) ||
          g.creatorName?.toLowerCase().includes(q) ||
          g.genre?.toLowerCase().includes(q) ||
          (Array.isArray(g.tags) && g.tags.some(t => t.toLowerCase().includes(q))) ||
          g.rootPlaceId?.toString().includes(q) ||
          g.universeId?.toString().includes(q)
        );
      })
    : [];

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
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
    if (e.key === 'Enter') handleCommitSearch();
  };

  const navItems = [
    { id: 'catalog', label: t('nav_games'), icon: Compass },
    { id: 'lists', label: t('nav_lists'), icon: ListOrdered },
    { id: 'diary', label: t('nav_diary'), icon: Calendar },
    { id: 'community', label: t('nav_community'), icon: Users }
  ] as const;

  const isActive = (id: string) =>
    activeTab === id || (id === 'lists' && activeTab === 'list-detail');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-bg">
      <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-3 sm:gap-4 md:gap-4 lg:gap-6 px-3 sm:px-6">
        {/* Wordmark: lowercase serif, the one place the brand speaks */}
        <button
          onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          aria-label="Bloxboxd"
        >
          <BloxboxdLogo size="sm" />
          <span className="font-serif text-[19px] sm:text-[21px] font-semibold leading-none tracking-[-0.02em] text-white">
            bloxboxd
          </span>
        </button>

        {/* Desktop nav: text links, active gets a green underline sitting on the rule */}
        <nav className="hidden h-12 items-stretch gap-3 md:flex lg:gap-5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`relative flex items-center text-[12px] lg:text-[13px] font-medium transition-colors ${
                isActive(item.id) ? 'text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {item.label}
              {isActive(item.id) && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-green" />
              )}
            </button>
          ))}
        </nav>

        {/* Desktop search: bordered field, responsive width */}
        <div ref={searchContainerRef} className="relative ml-auto hidden w-[180px] md:block lg:w-[240px] xl:w-[300px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            {isSearchingApi && (
              <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-faint" />
            )}
            <input
              type="text"
              aria-label={t('nav_search_placeholder')}
              placeholder={t('nav_search_placeholder')}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              className="bb-input h-8 pl-8 pr-8 text-[12px] lg:text-[13px]"
            />
            {query && !isSearchingApi && (
              <button
                onClick={() => { setQuery(''); setSearchQuery(''); setApiResults([]); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-faint hover:text-ink"
                title={language === 'id' ? 'Hapus ketikan' : 'Clear search'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Results panel: flat surface, hairline dividers, one elevation */}
          {isSearchOpen && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-[3px] border border-line bg-panel shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
              {isRobloxUrl && (
                <button
                  onClick={() => { setIsSearchOpen(false); setUrlImportModalOpen(true); }}
                  className="flex w-full items-center justify-between border-b border-line bg-panel-2 px-3 py-2 text-left text-[12px] font-semibold text-blue"
                >
                  <span className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {t('nav_url_detected')}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}

              {userResults.length > 0 && (
                <div className="border-b border-line">
                  <div className="bb-label flex items-center gap-1.5 px-3 py-1.5">
                    <Users className="h-3 w-3" />
                    {t('nav_users_section')} · {userResults.length}
                  </div>
                  {userResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className="flex w-full items-center gap-2.5 border-t border-line-soft px-3 py-2 text-left hover:bg-panel-2"
                    >
                      <img
                        src={safeAvatarSrc(u.avatarUrl)}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full border border-line object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-ink">
                          {u.displayName || u.username}
                        </span>
                        <span className="block truncate text-[11px] text-faint">@{u.handle || u.username}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {combinedResults.length > 0 ? (
                <div>
                  <div className="bb-label flex items-center justify-between px-3 py-1.5">
                    <span>{t('nav_games_section')} · {combinedResults.length}</span>
                    {isSearchingApi && <span>{t('nav_searching_live')}</span>}
                  </div>
                  {combinedResults.map(game => (
                    <button
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className="flex w-full items-center gap-2.5 border-t border-line-soft px-3 py-2 text-left hover:bg-panel-2"
                    >
                      <img
                        src={safeImgSrc(game.iconUrl)}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-[2px] border border-line object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-ink">{game.name}</span>
                        <span className="block truncate text-[11px] text-faint">
                          {game.creatorName} · <span className="text-orange">★ {game.ratingAverage?.toFixed(1) || '4.0'}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => handleCommitSearch()}
                    className="flex w-full items-center justify-between border-t border-line px-3 py-2 text-left text-[12px] font-semibold text-blue hover:bg-panel-2"
                  >
                    <span>{t('nav_search_in_catalog_full', { query })}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                !isRobloxUrl && userResults.length === 0 && (
                  <div className="px-3 py-4 text-center text-[12px] text-faint">
                    {isSearchingApi ? (
                      t('nav_searching_servers')
                    ) : (
                      <>
                        <p>{t('nav_no_instant_results', { query })}</p>
                        <button
                          onClick={() => handleCommitSearch()}
                          className="mt-1.5 text-[12px] font-semibold text-blue hover:underline"
                        >
                          {t('nav_search_catalog_btn')}
                        </button>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button
            onClick={() => setUrlImportModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[2px] text-muted transition-colors hover:bg-panel hover:text-white"
            title={language === 'id' ? 'Tambah game Roblox via link atau Place ID' : 'Add a Roblox game via link or Place ID'}
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="flex h-8 items-center gap-1 rounded-[2px] px-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint transition-colors hover:text-ink"
            title={language === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
          >
            <Globe className="h-3 w-3" />
            {language === 'id' ? 'ID' : 'EN'}
          </button>

          {!user ? (
            <button onClick={() => setLoginModalOpen(true)} className="bb-btn bb-btn-secondary">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('nav_login_roblox')}</span>
              <span className="sm:hidden">{t('nav_login_short')}</span>
            </button>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex h-8 items-center gap-2 rounded-[2px] border border-transparent pl-0.5 pr-1.5 transition-colors hover:border-line hover:bg-panel"
              >
                <img
                  src={safeAvatarSrc(user.avatarUrl)}
                  alt=""
                  className="h-6 w-6 rounded-full border border-line object-cover"
                />
                <span className="hidden max-w-[90px] truncate text-[12px] font-semibold text-ink sm:inline">
                  {user.displayName}
                </span>
                <ChevronDown className={`h-3 w-3 text-faint transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <>
                  {/* Backdrop on mobile so tapping outside closes it immediately */}
                  <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
                    onClick={() => setProfileMenuOpen(false)}
                  />

                  <div className="fixed inset-x-4 top-14 z-50 overflow-hidden rounded-[8px] border border-line bg-[#181d22] shadow-[0_20px_48px_rgba(0,0,0,0.8)] md:absolute md:inset-x-auto md:top-full md:right-0 md:mt-1 md:w-60 md:rounded-[3px] md:shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
                    <div className="border-b border-line px-3.5 py-2.5 bg-bg/50">
                      <p className="truncate text-[13px] font-semibold text-white">{user.displayName}</p>
                      <p className="truncate text-[11px] text-faint">@{user.username}</p>
                      {user.isVerifiedOwner && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-green">
                          <ShieldCheck className="h-3 w-3" /> {t('nav_verified')}
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      {[
                        { icon: User, label: t('nav_my_profile'), action: () => { setSelectedUserId(null); setActiveTab('profile'); setActiveProfileTab('overview'); } },
                        { icon: Compass, label: t('nav_my_collection'), action: () => { setSelectedUserId(null); setActiveTab('profile'); setActiveProfileTab('games'); } },
                        { icon: ShieldCheck, label: t('nav_switch_account'), action: () => setLoginModalOpen(true) },
                        { icon: Settings, label: t('nav_edit_profile'), action: () => setEditProfileModalOpen(true) }
                      ].map(({ icon: Icon, label, action }) => (
                        <button
                          key={label}
                          onClick={() => { action(); setProfileMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] text-muted transition-colors hover:bg-panel-2 hover:text-white min-h-[40px]"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}

                      <button
                        onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12px] text-muted transition-colors hover:bg-panel-2 hover:text-white min-h-[40px]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Globe className="h-3.5 w-3.5" />
                          {t('nav_lang_toggle')}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.08em] text-faint">
                          {language === 'id' ? 'ID' : 'EN'}
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-line py-1">
                      <button
                        onClick={() => { logoutRobloxAccount(); setProfileMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] text-muted transition-colors hover:bg-panel-2 hover:text-orange min-h-[40px]"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {t('nav_logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: search row + text nav, both on hairlines */}
      <div ref={mobileSearchContainerRef} className="relative border-t border-line-soft px-4 py-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            type="text"
            aria-label={t('nav_search_placeholder')}
            placeholder={t('nav_search_placeholder')}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsSearchOpen(true); }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleKeyDown}
            className="bb-input h-8 pl-8 pr-8 text-[13px]"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchQuery(''); setApiResults([]); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-faint"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isSearchOpen && query.trim().length > 0 && (
          <div className="absolute left-4 right-4 top-full z-50 max-h-80 overflow-y-auto rounded-[3px] border border-line bg-panel shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
            {userResults.length > 0 && (
              <div className="border-b border-line">
                <div className="bb-label flex items-center gap-1.5 px-3 py-1.5">
                  <Users className="h-3 w-3" />
                  {t('nav_users_section')} · {userResults.length}
                </div>
                {userResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u.id)}
                    className="flex w-full items-center gap-2.5 border-t border-line-soft px-3 py-2 text-left"
                  >
                    <img src={safeAvatarSrc(u.avatarUrl)} alt="" className="h-7 w-7 rounded-full border border-line object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-ink">{u.displayName || u.username}</span>
                      <span className="block truncate text-[11px] text-faint">@{u.handle || u.username}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {combinedResults.length > 0 ? (
              <div>
                <div className="bb-label px-3 py-1.5">{t('nav_games_section')} · {combinedResults.length}</div>
                {combinedResults.map(game => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className="flex w-full items-center gap-2.5 border-t border-line-soft px-3 py-2 text-left"
                  >
                    <img src={safeImgSrc(game.iconUrl)} alt="" className="h-8 w-8 rounded-[2px] border border-line object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-ink">{game.name}</span>
                      <span className="block truncate text-[11px] text-faint">
                        {game.creatorName} · <span className="text-orange">★ {game.ratingAverage?.toFixed(1) || '4.0'}</span>
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => handleCommitSearch()}
                  className="flex w-full items-center justify-between border-t border-line px-3 py-2 text-[12px] font-semibold text-blue"
                >
                  <span>{t('nav_search_in_catalog', { query })}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              userResults.length === 0 && (
                <div className="px-3 py-3 text-center text-[12px] text-faint">
                  {isSearchingApi ? t('nav_searching_servers') : t('nav_no_instant_results', { query })}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Mobile tab bar */}
      <nav className="flex items-stretch border-t border-line-soft md:hidden bg-bg">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 min-h-[44px] text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                isActive(item.id) ? 'text-white' : 'text-faint hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {isActive(item.id) && <span className="absolute inset-x-0 top-0 h-[2px] bg-green" />}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
