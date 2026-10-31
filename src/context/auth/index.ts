/**
 * Auth module barrel export.
 *
 * Extracted from AppContext.tsx to improve testability and separation of concerns.
 *
 * - authHelpers: pure functions for building/merging UserProfile objects,
 *   auth headers, and session/user-data fetch utilities.
 * - useAuthCrossWindowSync: cross-window OAuth callback listener
 *   (postMessage + BroadcastChannel + storage event).
 * - useSessionSync: mount-time /api/me reconciliation + user.data refetch on
 *   user.id change.
 *
 * The AppContextType interface and all exported function signatures
 * (loginWithRobloxAccount, logoutRobloxAccount, updateUserProfile, toggleFavorite,
 *  setUser, etc.) remain unchanged for backward compatibility.
 */
export * from './authHelpers';
export { useAuthCrossWindowSync } from './useAuthCrossWindowSync';
export type { AuthSyncDeps } from './useAuthCrossWindowSync';
export { useSessionSync } from './useSessionSync';
export type { SessionSyncDeps } from './useSessionSync';
