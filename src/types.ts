export type ShelfStatus = 'played' | 'playing' | 'backlog' | 'dropped';
export type SortOption = 'popular' | 'rating' | 'visits' | 'newest' | 'az';

export interface Game {
  id: string;
  universeId: number;
  rootPlaceId: number;
  name: string;
  description: string;
  creatorName: string;
  creatorType: 'User' | 'Group' | 'Verified' | string;
  iconUrl: string;
  bannerUrl?: string;
  genre: string;
  subgenre?: string;
  genre_l1?: string;
  genre_l2?: string;
  playerCount?: number;
  totalVisits?: string;
  rawVisits?: number;
  favoritedCount?: number;
  upVotes?: number;
  downVotes?: number;
  releaseYear?: number;
  ratingAverage: number;
  ratingCount: number;
  ratingHistogram: { [stars: string]: number }; // e.g. "0.5": 10, "1.0": 5, ..., "5.0": 120
  tags: string[];
}

export interface GameLog {
  id: string;
  userId: string;
  gameId: string;
  status: ShelfStatus;
  rating?: number; // 0.5 to 5.0
  reviewText?: string;
  hasSpoilers?: boolean;
  isFavorite?: boolean;
  isLiked?: boolean;
  loggedDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  gameId: string;
  gameTitle: string;
  gameIcon: string;
  userId: string;
  username: string;
  userAvatar: string;
  rating?: number;
  reviewText: string;
  hasSpoilers: boolean;
  isLiked: boolean;
  likesCount: number;
  commentsCount?: number;
  loggedDate: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  handle: string;
  robloxUsername: string;
  robloxDisplayName?: string;
  robloxUserId?: number;
  isRobloxVerified?: boolean;
  avatarUrl: string;
  avatarBustUrl?: string;
  bio: string;
  joinedDate: string;
  robloxJoinedDate?: string;
  robloxFriendsCount?: number;
  favoriteGameIds: string[]; // up to 4 games
}

export interface ListItem {
  id: string;
  gameId: string;
  position: number;
  notes?: string;
}

export interface CustomList {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  isRanked: boolean;
  isPublic: boolean;
  items: ListItem[];
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export const DEFAULT_AVATAR_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="420" height="420">
  <rect width="420" height="420" fill="#182029"/>
  <circle cx="210" cy="155" r="65" fill="#00E59B"/>
  <path d="M85 360c0-68 56-125 125-125s125 57 125 125z" fill="#00E59B"/>
</svg>
`.trim())}`;

export const DEFAULT_ICON_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#141920"/>
  <rect x="32" y="32" width="448" height="448" rx="32" fill="#1a222c" stroke="#2a3746" stroke-width="8"/>
  <path d="M190 200h-30v-30a15 15 0 0 0-30 0v30h-30a15 15 0 0 0 0 30h30v30a15 15 0 0 0 30 0v-30h30a15 15 0 0 0 0-30z" fill="#00E59B"/>
  <circle cx="370" cy="200" r="18" fill="#00A2FF"/>
  <circle cx="410" cy="240" r="18" fill="#FF8000"/>
  <circle cx="330" cy="240" r="18" fill="#00E59B"/>
  <circle cx="370" cy="280" r="18" fill="#EAB308"/>
  <text x="256" y="390" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">ROBLOX EXPERIENCE</text>
</svg>
`.trim())}`;

/**
 * Scheme-level gate for URL attributes (img src, etc.).
 * Blocks javascript:, data:text/html, and tab-obfuscated non-http schemes.
 * Allows: https:, http:, // (protocol-relative), / (root-relative), data:image/*.
 */
const ALLOWED_URL_SCHEMES = /^(\/\/\/|[a-z][a-z0-9+\-.]*:)/i;
const isSafeUrl = (url: string): boolean => {
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Reject empty-hash / javascript: schemes and any data: that isn't image/*
  if (/^data:/i.test(trimmed)) {
    return /^data:image\/[a-z0-9.+]+(?:;base64)?,/i.test(trimmed);
  }
  if (/^javascript:/i.test(trimmed)) return false;
  if (/^\s*</i.test(trimmed)) return false; // tab-obfuscation / control chars
  return true;
};

/**
 * Returns a guaranteed non-empty image src string.
 * Avoids browser warning: An empty string ("") was passed to the src attribute.
 * Also blocks javascript: and data:text/html to prevent XSS via iconUrl/avatarUrl.
 */
export const safeImgSrc = (url?: string | null, fallback: string = DEFAULT_ICON_URL): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  const candidate = url.trim();
  return isSafeUrl(candidate) ? candidate : fallback;
};

export const safeAvatarSrc = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return DEFAULT_AVATAR_URL;
  const candidate = url.trim();
  return isSafeUrl(candidate) ? candidate : DEFAULT_AVATAR_URL;
};
