import { UserProfile } from '../../types';
import { DEFAULT_AVATAR_URL } from '../../types';

export interface RobloxData {
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
}

/**
 * Build a UserProfile from Roblox OAuth data.
 * Extracted as a pure function so it can be unit-tested independently
 * of React state lifecycle.
 *
 * Preserves the exact UserProfile shape used by loginWithRobloxAccount,
 * including DEFAULT_AVATAR_URL fallback for avatar.
 */
export function buildUserProfile(robloxData: RobloxData): UserProfile {
  const newUsername = robloxData.displayName || robloxData.username;
  const newAvatar = robloxData.avatarHeadshotUrl;
  const userIdStr = `user-roblox-${robloxData.userId}`;

  return {
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
}

/**
 * Merge a server-side profile into an existing user profile.
 * favoriteGameIds from the server take priority when present,
 * otherwise the existing array is preserved.
 */
export function mergeUserProfile(existing: UserProfile | null, serverProfile: any): UserProfile {
  if (!existing) {
    return {
      ...serverProfile,
      favoriteGameIds: Array.isArray(serverProfile.favoriteGameIds)
        ? serverProfile.favoriteGameIds
        : []
    } as UserProfile;
  }
  return {
    ...existing,
    ...serverProfile,
    favoriteGameIds: Array.isArray(serverProfile.favoriteGameIds)
      ? serverProfile.favoriteGameIds
      : existing.favoriteGameIds
  };
}

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

/**
 * Fetch the authenticated user principal from /api/me.
 * Returns the server user or null if the session is anonymous/invalid.
 */
export async function fetchMeUser(): Promise<any | null> {
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.user ?? null;
  } catch (err) {
    console.warn('Failed to reconcile identity from /api/me:', err);
    return null;
  }
}

/**
 * Fetch user logs + authoritative profile from /api/user/data.
 */
export async function fetchUserData(userId: string): Promise<{ logs: any[]; profile: any } | null> {
  try {
    const res = await fetch(`/api/user/data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      logs: Array.isArray(data?.logs) ? data.logs : [],
      profile: data?.profile ?? null
    };
  } catch (err) {
    console.warn('Failed to sync user data from database:', err);
    return null;
  }
}

/** Broadcast channel name for cross-window auth events. */
export const AUTH_CHANNEL = 'bloxboxd_auth';

/** Message type for auth success broadcasts. */
export const AUTH_MESSAGE_TYPE = 'BLOXBOXD_AUTH_SUCCESS';
