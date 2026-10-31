import { useEffect, useRef, useCallback } from 'react';
import { buildUserProfile, AUTH_CHANNEL, AUTH_MESSAGE_TYPE } from './authHelpers';
import { UserProfile } from '../../types';

export interface AuthSyncDeps {
  user: UserProfile | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setUser: (user: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => void;
  setUserLogs: (logs: any[]) => void;
  setLoginModalOpen: (open: boolean) => void;
  language: 'id' | 'en';
  fetchUserLogsAndProfile: (userId: string, existingUser: UserProfile) => void;
}

/**
 * Listens for OAuth callback messages across all cross-window channels
 * (postMessage, BroadcastChannel, storage event) and reconciles the auth
 * principal into the app context.
 *
 * Deduplicates auth events within a 4-second window per robloxUserId
 * to prevent duplicate processing across multiple tabs.
 */
export function useAuthCrossWindowSync(deps: AuthSyncDeps): void {
  const {
    user,
    showToast,
    setUser,
    setUserLogs,
    setLoginModalOpen,
    language,
    fetchUserLogsAndProfile
  } = deps;

  const lastAuthHandledRef = useRef<{ key?: string; timestamp: number }>({ timestamp: 0 });
  const showToastRef = useRef(showToast);
  const setUserRef = useRef(setUser);
  const setUserLogsRef = useRef(setUserLogs);
  const setLoginModalOpenRef = useRef(setLoginModalOpen);
  const fetchUserLogsAndProfileRef = useRef(fetchUserLogsAndProfile);
  const languageRef = useRef(language);

  useEffect(() => {
    showToastRef.current = showToast;
    setUserRef.current = setUser;
    setUserLogsRef.current = setUserLogs;
    setLoginModalOpenRef.current = setLoginModalOpen;
    fetchUserLogsAndProfileRef.current = fetchUserLogsAndProfile;
    languageRef.current = language;
  }, [showToast, setUser, setUserLogs, setLoginModalOpen, fetchUserLogsAndProfile, language]);

  const handleUserData = useCallback((u: any) => {
    if (!u || !u.robloxUserId) return;

    const authKey = String(u.robloxUserId);
    const now = Date.now();
    if (lastAuthHandledRef.current.key === authKey && now - lastAuthHandledRef.current.timestamp < 4000) {
      return;
    }
    lastAuthHandledRef.current = { key: authKey, timestamp: now };

    const newUser = buildUserProfile({
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

    // Reset logs for new user account
    setUserLogsRef.current([]);
    setUserRef.current(newUser);

    // Update author fields on reviews & custom lists
    setLoginModalOpenRef.current(false);

    // Fetch user logs & authoritative profile from Turso database
    fetchUserLogsAndProfileRef.current(newUser.id, newUser);

    showToastRef.current(
      languageRef.current === 'id'
        ? `Berhasil masuk sebagai @${u.username || u.robloxUsername}!`
        : `Signed in as @${u.username || u.robloxUsername}!`,
      'success'
    );
  }, []);

  const handleAuthMessage = useCallback((e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === AUTH_MESSAGE_TYPE && e.data.user) {
      handleUserData(e.data.user);
    }
  }, [handleUserData]);

  const handleStorage = useCallback((e: StorageEvent) => {
    if (e.key === 'bloxboxd_oauth_event' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.user) handleUserData(parsed.user);
      } catch {}
    }
  }, [handleUserData]);

  useEffect(() => {
    window.addEventListener('message', handleAuthMessage);
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(AUTH_CHANNEL);
        bc.onmessage = (e) => {
          if (e.data?.type === AUTH_MESSAGE_TYPE && e.data.user) {
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
  }, [handleAuthMessage, handleStorage, handleUserData]);
}
