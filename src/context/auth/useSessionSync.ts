import { useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../../types';
import { fetchMeUser, fetchUserData, mergeUserProfile } from './authHelpers';

export interface SessionSyncDeps {
  user: UserProfile | null;
  setUser: (user: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => void;
  setUserLogs: (logs: any[]) => void;
  setReviews: (updater: (prev: any[]) => any[]) => void;
  setCustomLists: (updater: (prev: any[]) => any[]) => void;
  language: 'id' | 'en';
}

/**
 * Coordinates session reconciliation:
 * - On mount: resolves auth principal from /api/me (not localStorage)
 * - On user.id change: fetches user logs & authoritative profile from /api/user/data
 *
 * Also provides `fetchUserLogsAndProfile` as a callback for the cross-window
 * auth sync hook to call after login.
 */
export function useSessionSync(deps: SessionSyncDeps) {
  const { user, setUser, setUserLogs, setReviews, setCustomLists, language } = deps;

  const setUserRef = useRef(setUser);
  const setUserLogsRef = useRef(setUserLogs);

  useEffect(() => {
    setUserRef.current = setUser;
    setUserLogsRef.current = setUserLogs;
  }, [setUser, setUserLogs]);

  // 1. Resolve auth principal from /api/me on mount
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      try {
        const serverUser = await fetchMeUser();
        if (cancelled) return;

        if (serverUser && serverUser.robloxUserId) {
          setUser(serverUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to reconcile identity from /api/me:', err);
      }
    };

    reconcile();
    return () => { cancelled = true; };
  }, [setUser]);

  // 2. Fetch logged-in user data (profile & logs) from database when user changes
  useEffect(() => {
    if (!user || !user.id) {
      setUserLogs([]);
      return;
    }

    let cancelled = false;

    const fetchUserDataAsync = async () => {
      try {
        const result = await fetchUserData(user.id);
        if (cancelled || !result) return;

        setUserLogs(result.logs);

        if (result.profile) {
          setUser(prev => {
            if (!prev) return result.profile;
            return mergeUserProfile(prev, result.profile);
          });
        }
      } catch (err) {
        console.warn('Failed to sync user data from database:', err);
      }
    };

    fetchUserDataAsync();
    return () => { cancelled = true; };
  }, [user?.id, setUser, setUserLogs]);

  // Callback for cross-window auth sync to call after login
  const fetchUserLogsAndProfile = useCallback(
    (userId: string, baseUser: UserProfile) => {
      let cancelled = false;

      fetchUserData(userId)
        .then(result => {
          if (cancelled || !result) return;

          if (result.logs.length > 0) {
            setUserLogsRef.current(result.logs);
          }

          if (result.profile) {
            setUser(prev => {
              if (!prev) return result.profile;
              return mergeUserProfile(prev, result.profile);
            });
          }
        })
        .catch(e => console.warn('Failed to fetch user data after login:', e));

      return () => { cancelled = true; };
    },
    [setUser, setUserLogsRef]
  );

  return { fetchUserLogsAndProfile };
}
