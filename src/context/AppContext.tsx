import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Game, GameLog, Review, UserProfile, CustomList, ShelfStatus, SortOption, DEFAULT_AVATAR_URL } from '../types';
import { Language, TranslationKey, getTranslation } from '../utils/translations';

export const deduplicateGames = (gameList: Game[]): Game[] => {
  const seenIds = new Set<string>();
  const seenUniverses = new Set<number>();
  const seenPlaces = new Set<number>();
  const result: Game[] = [];

  for (const g of gameList) {
    if (!g || !g.id) continue;
    if (seenIds.has(g.id)) continue;
    if (g.universeId && seenUniverses.has(g.universeId)) continue;
    if (g.rootPlaceId && seenPlaces.has(g.rootPlaceId)) continue;

    seenIds.add(g.id);
    if (g.universeId) seenUniverses.add(g.universeId);
    if (g.rootPlaceId) seenPlaces.add(g.rootPlaceId);
    result.push(g);
  }

  return result;
};

/**
 * Auth headers for write API calls.
 *
 * SECURITY: the session token is transported ONLY via the `bb_session`
 * httpOnly cookie, which the browser attaches automatically to every
 * same-origin fetch (fetch default `credentials: 'same-origin'`). The token
 * is never read by JS and never stored in localStorage, so an XSS payload
 * cannot exfiltrate it. We therefore send no Authorization header from the
 * client. Server-side `extractSessionToken` reads the cookie first.
 */
export const authHeaders = (): Record<string, string> => ({});

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface AppContextType {
  games: Game[];
  user: UserProfile | null;
  userLogs: GameLog[];
  reviews: Review[];
  customLists: CustomList[];
  activeTab: 'catalog' | 'game-detail' | 'profile' | 'diary' | 'lists' | 'list-detail' | 'community';
  selectedGameId: string | null;
  selectedListId: string | null;
  selectedUserId: string | null;
  searchQuery: string;
  selectedGenre: string;
  sortBy: SortOption;
  minRating: number;
  minPlayers: number;
  isRealtimeSyncing: boolean;
  lastSyncTimestamp: number | null;
  activeProfileTab: 'overview' | 'diary' | 'games' | 'reviews' | 'backlog';
  logModalOpen: boolean;
  logModalGame: Game | null;
  urlImportModalOpen: boolean;
  loginModalOpen: boolean;
  editProfileModalOpen: boolean;
  createListModalOpen: boolean;
  setActiveTab: (tab: 'catalog' | 'game-detail' | 'profile' | 'diary' | 'lists' | 'list-detail' | 'community') => void;
  setSelectedGameId: (id: string | null) => void;
  setSelectedListId: (id: string | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setSelectedUserId: (id: string | null) => void;
  viewUserProfile: (userId: string) => void;
  incrementReviewCommentsCount: (reviewId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setSortBy: (sort: SortOption) => void;
  setMinRating: (rating: number) => void;
  setMinPlayers: (players: number) => void;
  resetAllFilters: () => void;
  refreshRealtimeStats: () => Promise<void>;
  setActiveProfileTab: (tab: 'overview' | 'diary' | 'games' | 'reviews' | 'backlog') => void;
  openLogModal: (game: Game) => void;
  closeLogModal: () => void;
  setUrlImportModalOpen: (open: boolean) => void;
  setLoginModalOpen: (open: boolean) => void;
  setEditProfileModalOpen: (open: boolean) => void;
  setCreateListModalOpen: (open: boolean) => void;
  loginWithRobloxAccount: (robloxData: {
    userId: number;
    username: string;
    displayName: string;
    avatarHeadshotUrl: string;
    avatarBustUrl?: string;
    bio?: string;
    description?: string;
    created?: string;
    friendsCount?: number;
    favoriteGameIds?: string[];
    isVerifiedOwner?: boolean;
  }) => void;
  logoutRobloxAccount: () => void;
  backToCatalog: () => void;
  viewGame: (gameId: string, gameObject?: Game) => void;
  viewList: (listId: string) => void;
  saveGameLog: (log: Omit<GameLog, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  deleteGameLog: (logId: string) => void;
  toggleGameStatus: (gameId: string, status: ShelfStatus) => void;
  toggleFavorite: (gameId: string) => void;
  toggleLike: (gameId: string) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  importGame: (newGame: Game) => void;
  addGameToCatalog: (newGame: Game) => void;
  addGamesToCatalog: (newGames: Game[]) => void;
  updateGame: (gameId: string, data: Partial<Game>) => void;
  createList: (list: { title: string; description: string; isRanked: boolean; isPublic: boolean; gameIds: string[] }) => void;
  updateList: (listId: string, list: { title: string; description: string; isRanked: boolean; isPublic: boolean; gameIds: string[] }) => void;
  deleteList: (listId: string) => void;
  clearAllLists: () => void;
  likeReview: (reviewId: string) => void;
  likeList: (listId: string) => void;
  getGameById: (id: string) => Game | undefined;
  getUserLogForGame: (gameId: string) => GameLog | undefined;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  confirmDialog: ConfirmDialogOptions | null;
  showConfirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure live catalog: initial state is empty; populated from Turso cache + live Roblox stream
  const [games, setGames] = useState<Game[]>(() => {
    const importedSaved = localStorage.getItem('bloxboxd_imported_games');
    if (importedSaved) {
      try {
        const imported: Game[] = JSON.parse(importedSaved);
        if (Array.isArray(imported)) return deduplicateGames(imported);
      } catch (e) {}
    }
    return [];
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('bloxboxd_user');
    if (saved) {
      try {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed && parsed.robloxUserId) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [userLogs, setUserLogs] = useState<GameLog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);

  // Cleanup legacy offline mirrors once on mount (A2: online-only)
  useEffect(() => {
    try {
      localStorage.removeItem('bloxboxd_logs');
      localStorage.removeItem('bloxboxd_reviews');
      localStorage.removeItem('bloxboxd_lists');
      localStorage.removeItem('bloxboxd_clean_v6');
    } catch {}
  }, []);

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bloxboxd_lang');
    return saved === 'en' ? 'en' : 'id';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bloxboxd_lang', lang);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  }, [language]);

  const [activeTab, setActiveTab] = useState<'catalog' | 'game-detail' | 'profile' | 'diary' | 'lists' | 'list-detail' | 'community'>('catalog');
  const [selectedGameId, setSelectedGameId] = useState<string | null>('game-doors');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [minRating, setMinRating] = useState<number>(0);
  const [minPlayers, setMinPlayers] = useState<number>(0);
  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState<boolean>(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'diary' | 'games' | 'reviews' | 'backlog'>('overview');

  // Modals
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logModalGame, setLogModalGame] = useState<Game | null>(null);
  const [urlImportModalOpen, setUrlImportModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [createListModalOpen, setCreateListModalOpen] = useState(false);

  // Toasts & Custom Confirm Dialog
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev: Toast[]) => prev.filter((t: Toast) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToasts((prev: Toast[]) => {
      // Prevent identical duplicate toasts from stacking
      if (prev.some(t => t.message === message)) return prev;
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setTimeout(() => {
        setToasts((current: Toast[]) => current.filter((t: Toast) => t.id !== id));
      }, 3800);
      return [...prev.slice(-2), { id, message, type }];
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSortBy('popular');
    setMinRating(0);
    setMinPlayers(0);
  }, []);

  // Sync profile metadata cache with LocalStorage (display purposes only)
  useEffect(() => {
    if (user) {
      localStorage.setItem('bloxboxd_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bloxboxd_user');
    }
  }, [user]);

  // 1. Fetch catalog games, community reviews, and public custom lists from Turso database
  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const [gamesRes, revRes, listRes] = await Promise.all([
          fetch('/api/games?limit=2000'),
          fetch('/api/reviews'),
          fetch('/api/lists')
        ]);
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          if (Array.isArray(gamesData.games) && gamesData.games.length > 0) {
            setGames(prev => deduplicateGames([...prev, ...gamesData.games]));
          }
        }
        if (revRes.ok) {
          const revData = await revRes.json();
          if (Array.isArray(revData.reviews) && revData.reviews.length > 0) {
            setReviews(revData.reviews);
          }
        }
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData.lists) && listData.lists.length > 0) {
            setCustomLists(listData.lists);
          }
        }
      } catch (err) {
        console.warn('Failed to sync community data from database:', err);
      }
    };

    fetchCommunityData();
  }, []);

  // 2. Fetch logged-in user data (profile & logs) from Turso database
  useEffect(() => {
    if (!user || !user.id) {
      setUserLogs([]);
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user/data?userId=${encodeURIComponent(user.id)}`);
        if (res.ok) {
          const data = await res.json();
          setUserLogs(Array.isArray(data.logs) ? data.logs : []);
          if (data.profile) {
            setUser(prev => {
              if (!prev) return data.profile;
              const merged = {
                ...prev,
                ...data.profile,
                favoriteGameIds: Array.isArray(data.profile.favoriteGameIds)
                  ? data.profile.favoriteGameIds
                  : prev.favoriteGameIds
              };
              localStorage.setItem('bloxboxd_user', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to sync user data from database:', err);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Keep a ref of current games to avoid stale closures in periodic polling
  const gamesRef = useRef(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  // Real-time synchronization engine with official Roblox APIs
  // Optimasi: Sinkronkan 30 game teratas saja (1 chunk) agar tidak memborbardir Roblox API dan terkena rate limit 429
  const refreshRealtimeStats = useCallback(async () => {
    const currentGames = gamesRef.current;
    const topActiveGames = [...currentGames]
      .filter(g => Boolean(g.universeId))
      .sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0))
      .slice(0, 30);

    const universeIds = topActiveGames.map(g => g.universeId);
    if (universeIds.length === 0) return;

    setIsRealtimeSyncing(true);
    try {
      const res = await fetch(`/api/roblox/batch?universeIds=${universeIds.join(',')}`);
      if (!res.ok) throw new Error('Batch fetch failed');
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        setGames(prev => prev.map(g => {
          const apiData = json.data.find((item: any) => item.universeId === g.universeId);
          if (!apiData) return g;
          return {
            ...g,
            playerCount: apiData.playerCount ?? g.playerCount,
            totalVisits: apiData.totalVisits ?? g.totalVisits,
            rawVisits: apiData.rawVisits ?? g.rawVisits,
            favoritedCount: apiData.favoritedCount ?? g.favoritedCount,
            upVotes: apiData.upVotes ?? g.upVotes,
            downVotes: apiData.downVotes ?? g.downVotes,
            ratingAverage: apiData.ratingAverage ?? g.ratingAverage,
            ratingCount: apiData.ratingCount ?? g.ratingCount,
            ratingHistogram: apiData.ratingHistogram ?? g.ratingHistogram,
            iconUrl: apiData.iconUrl || g.iconUrl,
            bannerUrl: apiData.bannerUrl || g.bannerUrl,
            genre: apiData.genre || g.genre,
            subgenre: apiData.subgenre ?? g.subgenre,
            genre_l1: apiData.genre_l1 ?? g.genre_l1,
            genre_l2: apiData.genre_l2 ?? g.genre_l2,
            name: apiData.name || g.name,
            description: apiData.description || g.description
          };
        }));
        setLastSyncTimestamp(Date.now());
      }
    } catch (err) {
      console.warn('Realtime sync error:', err);
    } finally {
      setIsRealtimeSyncing(false);
    }
  }, []);

  // Keep ref to deduplicate cross-window auth broadcast (postMessage + BroadcastChannel + storage event)
  const lastAuthHandledRef = useRef<{ key?: string; timestamp: number }>({ timestamp: 0 });

  // Listen for OAuth callback messages across all cross-window channels (postMessage, BroadcastChannel, storage event)
  useEffect(() => {
    const handleUserData = (u: any) => {
      if (!u || !u.robloxUserId) return;

      const authKey = String(u.robloxUserId);
      const now = Date.now();
      if (lastAuthHandledRef.current.key === authKey && now - lastAuthHandledRef.current.timestamp < 4000) {
        return;
      }
      lastAuthHandledRef.current = { key: authKey, timestamp: now };

      loginWithRobloxAccount({
        userId: u.robloxUserId,
        username: u.username || u.robloxUsername,
        displayName: u.displayName || u.username,
        avatarHeadshotUrl: u.avatarUrl,
        avatarBustUrl: u.avatarBustUrl,
        bio: u.bio,
        created: u.joinedDate,
        friendsCount: u.friendsCount,
        favoriteGameIds: u.favoriteGameIds,
        isVerifiedOwner: true
      });
      setLoginModalOpen(false);
    };

    const handleAuthMessage = (e: MessageEvent) => {
      // SECURITY: only accept auth broadcasts from our own origin.
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'BLOXBOXD_AUTH_SUCCESS' && e.data.user) {
        handleUserData(e.data.user);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bloxboxd_oauth_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.user) handleUserData(parsed.user);
        } catch {}
      }
    };

    window.addEventListener('message', handleAuthMessage);
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('bloxboxd_auth');
        bc.onmessage = (e) => {
          if (e.data?.type === 'BLOXBOXD_AUTH_SUCCESS' && e.data.user) {
            handleUserData(e.data.user);
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, []);

  // Initial sync on mount and auto-refresh every 90 seconds (interval aman dari rate limit Roblox)
  useEffect(() => {
    refreshRealtimeStats();

    const interval = setInterval(() => {
      refreshRealtimeStats();
    }, 90000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshRealtimeStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshRealtimeStats]);

  const backToCatalog = () => {
    setActiveTab('catalog');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const viewGame = (gameId: string, gameObject?: Game) => {
    if (gameObject) {
      setGames(prev => {
        if (prev.some(g => g.id === gameObject.id || (gameObject.universeId && g.universeId === gameObject.universeId) || (gameObject.rootPlaceId && g.rootPlaceId === gameObject.rootPlaceId))) {
          return prev;
        }
        return deduplicateGames([gameObject, ...prev]);
      });
    }
    setSelectedGameId(gameId);
    setActiveTab('game-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewList = (listId: string) => {
    setSelectedListId(listId);
    setActiveTab('list-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewUserProfile = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const incrementReviewCommentsCount = useCallback((reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return { ...r, commentsCount: (r.commentsCount || 0) + 1 };
      }
      return r;
    }));
  }, []);

  const openLogModal = (game: Game) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    setLogModalGame(game);
    setLogModalOpen(true);
  };

  const closeLogModal = () => {
    setLogModalOpen(false);
    setLogModalGame(null);
  };

  const getGameById = (id: string) => games.find(g => g.id === id);
  const getUserLogForGame = (gameId: string) => userLogs.find(l => l.gameId === gameId);

  // Save or update game log
  const saveGameLog = (logData: Omit<GameLog, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const existingIndex = userLogs.findIndex(l => l.gameId === logData.gameId);
    const now = new Date().toISOString();
    let updatedLogs: GameLog[];

    if (existingIndex >= 0) {
      const existing = userLogs[existingIndex];
      const updated: GameLog = {
        ...existing,
        ...logData,
        updatedAt: now
      };
      updatedLogs = [...userLogs];
      updatedLogs[existingIndex] = updated;
    } else {
      const newLog: GameLog = {
        id: `log-${user.id}-${logData.gameId}`,
        userId: user.id,
        ...logData,
        createdAt: now,
        updatedAt: now
      };
      updatedLogs = [newLog, ...userLogs];
    }
    setUserLogs(updatedLogs);

    // Sync log to database in background
    const savedLog = updatedLogs.find(l => l.gameId === logData.gameId);
    if (savedLog) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'same-origin',
        body: JSON.stringify(savedLog)
      }).then(res => {
        if (!res.ok) {
          console.warn('Log save failed on server:', res.status);
          showToast(language === 'id' ? 'Gagal menyimpan catatan ke server.' : 'Failed to save log to server.', 'error');
        }
      }).catch(e => console.warn('Failed to sync log to database:', e));
    }

    // If reviewText is provided, create or update in community reviews
    const targetGame = getGameById(logData.gameId);
    if (logData.reviewText && targetGame) {
      const existingRevIndex = reviews.findIndex(r => r.gameId === logData.gameId && r.userId === user.id);
      let targetReview: Review;
      if (existingRevIndex >= 0) {
        const updatedRevs = [...reviews];
        targetReview = {
          ...updatedRevs[existingRevIndex],
          rating: logData.rating,
          reviewText: logData.reviewText,
          hasSpoilers: logData.hasSpoilers ?? false,
          isLiked: logData.isLiked ?? false,
          loggedDate: logData.loggedDate
        };
        updatedRevs[existingRevIndex] = targetReview;
        setReviews(updatedRevs);
      } else {
        targetReview = {
          id: `rev-${user.id}-${logData.gameId}`,
          gameId: logData.gameId,
          gameTitle: targetGame.name,
          gameIcon: targetGame.iconUrl,
          userId: user.id,
          username: user.username,
          userAvatar: user.avatarUrl,
          rating: logData.rating,
          reviewText: logData.reviewText,
          hasSpoilers: logData.hasSpoilers ?? false,
          isLiked: logData.isLiked ?? false,
          likesCount: 0,
          loggedDate: logData.loggedDate,
          createdAt: now
        };
        setReviews([targetReview, ...reviews]);
      }

      // Sync review to database in background
      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'same-origin',
        body: JSON.stringify(targetReview)
      }).then(res => {
        if (!res.ok) {
          console.warn('Review save failed on server:', res.status);
          showToast(language === 'id' ? 'Gagal menyimpan ulasan ke server.' : 'Failed to save review to server.', 'error');
        }
      }).catch(e => console.warn('Failed to sync review to database:', e));
    }

    // Update game rating histogram & aggregate if rating provided
    if (logData.rating && targetGame) {
      const ratingKey = logData.rating.toFixed(1);
      const newHistogram = { ...targetGame.ratingHistogram };
      newHistogram[ratingKey] = (newHistogram[ratingKey] || 0) + 1;
      const totalCount = targetGame.ratingCount + 1;
      const newAverage = Number(
        (((targetGame.ratingAverage * targetGame.ratingCount) + logData.rating) / totalCount).toFixed(1)
      );

      setGames(prev => prev.map(g => g.id === targetGame.id ? {
        ...g,
        ratingAverage: newAverage,
        ratingCount: totalCount,
        ratingHistogram: newHistogram
      } : g));
    }

    // Update favorite in user favorites if isFavorite is true
    let updatedFavs: string[] | null = null;
    if (logData.isFavorite) {
      if (!user.favoriteGameIds.includes(logData.gameId)) {
        updatedFavs = [logData.gameId, ...user.favoriteGameIds].slice(0, 4);
      }
    } else {
      if (user.favoriteGameIds.includes(logData.gameId)) {
        updatedFavs = user.favoriteGameIds.filter(id => id !== logData.gameId);
      }
    }

    if (updatedFavs) {
      const updatedUser = { ...user, favoriteGameIds: updatedFavs };
      setUser(updatedUser);
      localStorage.setItem('bloxboxd_user', JSON.stringify(updatedUser));
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updatedUser)
      }).catch(e => console.warn('Failed to sync favorites to database:', e));
    }

    showToast(language === 'id' ? 'Catatan game berhasil disimpan!' : 'Game log saved successfully!', 'success');
  };

  const deleteGameLog = (logId: string) => {
    if (!user) return;
    const log = userLogs.find(l => l.id === logId);
    if (log) {
      setUserLogs(prev => prev.filter(l => l.id !== logId));
      setReviews(prev => prev.filter(r => !(r.gameId === log.gameId && (r.userId === user.id || r.userId.replace('user-roblox-', '') === user.id.replace('user-roblox-')))));
      if (user.favoriteGameIds.includes(log.gameId)) {
        const remainingFavs = user.favoriteGameIds.filter(id => id !== log.gameId);
        const updatedUser = { ...user, favoriteGameIds: remainingFavs };
        setUser(updatedUser);
        localStorage.setItem('bloxboxd_user', JSON.stringify(updatedUser));
        fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify(updatedUser)
        }).catch(() => {});
      }

      fetch(`/api/logs/${encodeURIComponent(logId)}?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
        credentials: 'same-origin'
      }).then(res => {
        if (!res.ok) {
          // Re-sync user data from Turso if delete rejected
          fetch(`/api/user/data?userId=${encodeURIComponent(user.id)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (Array.isArray(d?.logs)) setUserLogs(d.logs); });
        }
      }).catch(e => console.warn('Failed to delete log in database:', e));

      showToast(language === 'id' ? 'Catatan game telah dihapus.' : 'Game log deleted.', 'info');
    }
  };

  const toggleGameStatus = (gameId: string, status: ShelfStatus) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const existing = getUserLogForGame(gameId);
    if (existing) {
      if (existing.status === status) {
        // Toggle off if same clicked
        return;
      }
      saveGameLog({
        ...existing,
        status
      });
    } else {
      saveGameLog({
        gameId,
        status,
        loggedDate: new Date().toISOString().split('T')[0],
        hasSpoilers: false,
        isFavorite: false,
        isLiked: false
      });
    }
  };

  const toggleFavorite = (gameId: string) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const isCurrentlyFav = user.favoriteGameIds.includes(gameId);
    let newFavs: string[];
    if (isCurrentlyFav) {
      newFavs = user.favoriteGameIds.filter(id => id !== gameId);
    } else {
      if (user.favoriteGameIds.length >= 4) {
        newFavs = [gameId, ...user.favoriteGameIds.slice(0, 3)];
      } else {
        newFavs = [...user.favoriteGameIds, gameId];
      }
    }

    const updatedUser = { ...user, favoriteGameIds: newFavs };
    setUser(updatedUser);
    localStorage.setItem('bloxboxd_user', JSON.stringify(updatedUser));

    // Persist immediately to Turso DB
    fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'same-origin',
      body: JSON.stringify(updatedUser)
    }).catch(e => console.warn('[AppContext] Failed to sync favorites to DB:', e));

    const log = getUserLogForGame(gameId);
    if (log) {
      saveGameLog({ ...log, isFavorite: !isCurrentlyFav });
    }
  };

  const toggleLike = (gameId: string) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const log = getUserLogForGame(gameId);
    if (log) {
      saveGameLog({ ...log, isLiked: !log.isLiked });
    } else {
      saveGameLog({
        gameId,
        status: 'played',
        isLiked: true,
        loggedDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('bloxboxd_user', JSON.stringify(updatedUser));

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'same-origin',
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Gagal menyimpan profil ke database.', 'error');
        return;
      }
      showToast(language === 'id' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!', 'success');
    } catch (e) {
      console.warn('Failed to update profile in database:', e);
      showToast('Gagal menghubungi server.', 'error');
    }
  };

  const loginWithRobloxAccount = (robloxData: {
    userId: number;
    username: string;
    displayName: string;
    avatarHeadshotUrl: string;
    avatarBustUrl?: string;
    bio?: string;
    description?: string;
    created?: string;
    friendsCount?: number;
    favoriteGameIds?: string[];
    isVerifiedOwner?: boolean;
  }) => {
    const newUsername = robloxData.displayName || robloxData.username;
    const newAvatar = robloxData.avatarHeadshotUrl;
    const userIdStr = `user-roblox-${robloxData.userId}`;

    const newUser: UserProfile = {
      id: userIdStr,
      username: newUsername,
      handle: robloxData.username.toLowerCase(),
      robloxUsername: robloxData.username,
      robloxDisplayName: robloxData.displayName,
      robloxUserId: robloxData.userId,
      isRobloxVerified: Boolean(robloxData.isVerifiedOwner),
      avatarUrl: newAvatar || DEFAULT_AVATAR_URL,
      avatarBustUrl: robloxData.avatarBustUrl,
      bio: robloxData.bio ?? robloxData.description ?? 'Penggemar game Roblox.',
      joinedDate: robloxData.created || 'Bergabung 2026',
      robloxJoinedDate: robloxData.created,
      robloxFriendsCount: robloxData.friendsCount,
      favoriteGameIds: Array.isArray(robloxData.favoriteGameIds) ? robloxData.favoriteGameIds : []
    };

    // Cleanly isolate session: reset logs for new user account
    setUserLogs([]);
    setUser(newUser);
    localStorage.setItem('bloxboxd_user', JSON.stringify(newUser));

    // Seamlessly update active user author fields on reviews & custom lists
    setReviews(prev => prev.map(r => r.userId === newUser.id ? {
      ...r,
      username: newUsername,
      userAvatar: newAvatar || r.userAvatar
    } : r));

    setCustomLists(prev => prev.map(l => l.userId === newUser.id ? {
      ...l,
      userName: newUsername,
      userAvatar: newAvatar || l.userAvatar
    } : l));

    // Fetch user logs & authoritative profile from Turso database (no phantom write!)
    fetch(`/api/user/data?userId=${encodeURIComponent(newUser.id)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data?.logs)) {
          setUserLogs(data.logs);
        }
        if (data?.profile) {
          setUser(prev => {
            if (!prev) return data.profile;
            const merged = {
              ...prev,
              ...data.profile,
              favoriteGameIds: Array.isArray(data.profile.favoriteGameIds)
                ? data.profile.favoriteGameIds
                : prev.favoriteGameIds
            };
            localStorage.setItem('bloxboxd_user', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(e => console.warn('Failed to fetch user data after login:', e));

    showToast(language === 'id' ? `Berhasil masuk sebagai @${robloxData.username}!` : `Signed in as @${robloxData.username}!`, 'success');
  };

  const logoutRobloxAccount = () => {
    fetch('/api/roblox/account/logout', {
      method: 'POST',
      headers: { ...authHeaders() },
      credentials: 'same-origin'
    }).catch(() => {});
    setUser(null);
    setUserLogs([]);
    localStorage.removeItem('bloxboxd_user');
    showToast(language === 'id' ? 'Berhasil keluar.' : 'Signed out.', 'info');
  };

  const importGame = (newGame: Game) => {
    const exists = games.find(g => 
      g.id === newGame.id || 
      (newGame.rootPlaceId && g.rootPlaceId === newGame.rootPlaceId) || 
      (newGame.universeId && g.universeId === newGame.universeId)
    );
    if (exists) {
      viewGame(exists.id);
      return;
    }
    setGames(prev => {
      const next = deduplicateGames([newGame, ...prev]);
      try {
        const customSaved = localStorage.getItem('bloxboxd_imported_games');
        const customList: Game[] = customSaved ? JSON.parse(customSaved) : [];
        if (!customList.some(g => g.id === newGame.id)) {
          localStorage.setItem('bloxboxd_imported_games', JSON.stringify([newGame, ...customList].slice(0, 50)));
        }
      } catch (e) {}
      return next;
    });

    // Persist to Turso database so all users can discover and review it
    fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ...newGame, userId: user?.id })
    }).catch(e => console.warn('Failed to save imported game to database:', e));

    viewGame(newGame.id);
  };

  const addGameToCatalog = (newGame: Game) => {
    setGames(prev => {
      const existsIndex = prev.findIndex(g => 
        g.id === newGame.id || 
        (newGame.rootPlaceId && g.rootPlaceId === newGame.rootPlaceId) || 
        (newGame.universeId && g.universeId === newGame.universeId)
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        const canonicalId = updated[existsIndex].id;
        updated[existsIndex] = { ...updated[existsIndex], ...newGame, id: canonicalId };
        return deduplicateGames(updated);
      }
      return deduplicateGames([...prev, newGame]);
    });

    fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ...newGame, userId: user?.id })
    }).catch(e => console.warn('Failed to persist game to database:', e));
  };

  const addGamesToCatalog = (newGames: Game[]) => {
    if (!newGames || newGames.length === 0) return;
    setGames(prev => {
      const updated = [...prev];
      const seenIds = new Set(updated.map(g => g.id));
      const seenUniverses = new Set(updated.map(g => g.universeId).filter(Boolean));
      const seenPlaces = new Set(updated.map(g => g.rootPlaceId).filter(Boolean));

      for (const ng of newGames) {
        if (!ng || !ng.id) continue;
        const idx = updated.findIndex(g => 
          g.id === ng.id || 
          (ng.universeId && g.universeId === ng.universeId) || 
          (ng.rootPlaceId && g.rootPlaceId === ng.rootPlaceId)
        );

        if (idx >= 0) {
          const canonicalId = updated[idx].id;
          updated[idx] = { ...updated[idx], ...ng, id: canonicalId };
        } else {
          if (seenIds.has(ng.id)) continue;
          if (ng.universeId && seenUniverses.has(ng.universeId)) continue;
          if (ng.rootPlaceId && seenPlaces.has(ng.rootPlaceId)) continue;

          seenIds.add(ng.id);
          if (ng.universeId) seenUniverses.add(ng.universeId);
          if (ng.rootPlaceId) seenPlaces.add(ng.rootPlaceId);
          updated.push(ng);
        }
      }

      return deduplicateGames(updated);
    });

    // Catatan: Penyimpanan ke Turso sudah ditangani secara otomatis di backend (server.ts)
    // saat endpoint /api/roblox/discover atau /api/roblox/search dipanggil.
    // Menghilangkan POST redundan dari client ini menghemat ribuan rows written ke Turso.
  };

  const createList = (listData: { title: string; description: string; isRanked: boolean; isPublic: boolean; gameIds: string[] }) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const newList: CustomList = {
      id: `list-${Date.now()}`,
      userId: user.id,
      userName: user.username,
      userAvatar: user.avatarUrl,
      title: listData.title,
      description: listData.description,
      isRanked: listData.isRanked,
      isPublic: listData.isPublic,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      items: listData.gameIds.map((gId, index) => ({
        id: `item-${Date.now()}-${index}`,
        gameId: gId,
        position: index + 1
      }))
    };
    setCustomLists(prev => [newList, ...prev]);

    fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'same-origin',
      body: JSON.stringify(newList)
    }).catch(e => console.warn('Failed to save list to database:', e));

    showToast(language === 'id' ? 'Daftar game berhasil dibuat!' : 'List created successfully!', 'success');
    viewList(newList.id);
  };

  const updateList = (listId: string, listData: { title: string; description: string; isRanked: boolean; isPublic: boolean; gameIds: string[] }) => {
    if (!user) return;
    const existing = customLists.find(l => l.id === listId);
    if (!existing) return;

    const updatedList: CustomList = {
      ...existing,
      title: listData.title,
      description: listData.description,
      isRanked: listData.isRanked,
      isPublic: listData.isPublic,
      items: listData.gameIds.map((gId, index) => ({
        id: `item-${Date.now()}-${index}`,
        gameId: gId,
        position: index + 1
      }))
    };

    setCustomLists(prev => prev.map(l => l.id === listId ? updatedList : l));

    fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'same-origin',
      body: JSON.stringify(updatedList)
    }).catch(e => console.warn('Failed to update list in database:', e));

    showToast(language === 'id' ? 'Daftar game berhasil diperbarui!' : 'List updated successfully!', 'success');
  };

  const deleteList = async (listId: string) => {
    setCustomLists(prev => prev.filter(l => l.id !== listId));
    if (selectedListId === listId) {
      setSelectedListId(null);
      setActiveTab('lists');
    }
    if (user) {
      try {
        const res = await fetch(`/api/lists/${encodeURIComponent(listId)}?userId=${encodeURIComponent(user.id)}`, {
          method: 'DELETE',
          headers: { ...authHeaders() },
          credentials: 'same-origin'
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('Failed to delete list from database:', err);
          showToast(err.error || 'Gagal menghapus daftar dari server.', 'error');
          // Re-sync lists from Turso database
          fetch('/api/lists')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (Array.isArray(d?.lists)) setCustomLists(d.lists); });
          return;
        }
        showToast(language === 'id' ? 'Daftar game telah dihapus.' : 'List deleted.', 'info');
      } catch (e) {
        console.warn('Failed to delete list from database:', e);
      }
    } else {
      showToast(language === 'id' ? 'Daftar game telah dihapus.' : 'List deleted.', 'info');
    }
  };

  const clearAllLists = () => {
    setCustomLists([]);
    setSelectedListId(null);
    setActiveTab('lists');
    showToast(language === 'id' ? 'Semua daftar lokal dibersihkan.' : 'All local lists cleared.', 'info');
  };

  const likeReview = (reviewId: string) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const isLiked = !r.isLiked;
        return {
          ...r,
          isLiked,
          likesCount: isLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1)
        };
      }
      return r;
    }));

    if (user) {
      fetch(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'same-origin',
        body: JSON.stringify({ userId: user.id })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && typeof data.likesCount === 'number') {
            setReviews(prev => prev.map(r => r.id === reviewId ? {
              ...r,
              isLiked: Boolean(data.liked),
              likesCount: data.likesCount
            } : r));
          }
        })
        .catch(e => console.warn('Failed to like review in database:', e));
    }
  };

  const updateGame = (gameId: string, data: Partial<Game>) => {
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, ...data } : g));
  };

  const likeList = (listId: string) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    setCustomLists(prev => prev.map(l => {
      if (l.id === listId) {
        const nextLiked = !l.isLiked;
        return {
          ...l,
          isLiked: nextLiked,
          likesCount: nextLiked ? (l.likesCount || 0) + 1 : Math.max(0, (l.likesCount || 0) - 1)
        };
      }
      return l;
    }));

    fetch(`/api/lists/${encodeURIComponent(listId)}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'same-origin',
      body: JSON.stringify({ userId: user.id })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.likesCount === 'number') {
          setCustomLists(prev => prev.map(l => l.id === listId ? {
            ...l,
            isLiked: Boolean(data.liked),
            likesCount: data.likesCount
          } : l));
        }
      })
      .catch(e => console.warn('Failed to toggle like list in database:', e));
  };

  return (
    <AppContext.Provider
      value={{
        games,
        user,
        userLogs,
        reviews,
        customLists,
        activeTab,
        selectedGameId,
        selectedListId,
        selectedUserId,
        setSelectedUserId,
        language,
        setLanguage,
        t,
        viewUserProfile,
        incrementReviewCommentsCount,
        searchQuery,
        selectedGenre,
        sortBy,
        minRating,
        minPlayers,
        isRealtimeSyncing,
        lastSyncTimestamp,
        activeProfileTab,
        logModalOpen,
        logModalGame,
        urlImportModalOpen,
        editProfileModalOpen,
        createListModalOpen,
        setActiveTab,
        setSelectedGameId,
        setSelectedListId,
        setSearchQuery,
        setSelectedGenre,
        setSortBy,
        setMinRating,
        setMinPlayers,
        resetAllFilters,
        refreshRealtimeStats,
        setActiveProfileTab,
        openLogModal,
        closeLogModal,
        setUrlImportModalOpen,
        loginModalOpen,
        setLoginModalOpen,
        setEditProfileModalOpen,
        setCreateListModalOpen,
        loginWithRobloxAccount,
        logoutRobloxAccount,
        backToCatalog,
        viewGame,
        viewList,
        saveGameLog,
        deleteGameLog,
        toggleGameStatus,
        toggleFavorite,
        toggleLike,
        updateUserProfile,
        importGame,
        addGameToCatalog,
        addGamesToCatalog,
        updateGame,
        createList,
        updateList,
        deleteList,
        clearAllLists,
        likeReview,
        likeList,
        getGameById,
        getUserLogForGame,
        toasts,
        showToast,
        removeToast,
        confirmDialog,
        showConfirm,
        closeConfirm
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
