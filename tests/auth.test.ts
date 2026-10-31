import assert from 'node:assert/strict';
import { buildUserProfile, mergeUserProfile, authHeaders, AUTH_CHANNEL, AUTH_MESSAGE_TYPE } from '../src/context/auth/authHelpers';
import { DEFAULT_AVATAR_URL } from '../src/types';
import type { UserProfile } from '../src/types';

console.log('[Auth Test] Running auth module verification suite...');

// 1. buildUserProfile — exact UserProfile shape from Roblox OAuth data
const profile = buildUserProfile({
  userId: 123456,
  username: 'player1',
  displayName: 'Player One',
  avatarHeadshotUrl: 'https://example.com/avatar.png',
  avatarBustUrl: 'https://example.com/bust.png',
  bio: 'Hello!',
  description: 'desc fallback',
  created: '2024-01-15',
  friendsCount: 42,
  favoriteGameIds: ['game1', 'game2'],
  isVerifiedOwner: true,
});

assert.equal(profile.id, 'user-roblox-123456');
assert.equal(profile.username, 'Player One');   // displayName takes priority
assert.equal(profile.handle, 'player1');        // lowercase of username
assert.equal(profile.robloxUsername, 'player1');
assert.equal(profile.robloxDisplayName, 'Player One');
assert.equal(profile.robloxUserId, 123456);
assert.equal(profile.isRobloxVerified, true);
assert.equal(profile.avatarUrl, 'https://example.com/avatar.png');
assert.equal(profile.avatarBustUrl, 'https://example.com/bust.png');
assert.equal(profile.bio, 'Hello!');           // bio takes priority over description
assert.equal(profile.joinedDate, '2024-01-15');
assert.equal(profile.robloxJoinedDate, '2024-01-15');
assert.equal(profile.robloxFriendsCount, 42);
assert.deepEqual(profile.favoriteGameIds, ['game1', 'game2']);

// 2. buildUserProfile — fallback bio when both bio and description missing
const profile2 = buildUserProfile({
  userId: 999,
  username: 'noface',
  displayName: '',
  avatarHeadshotUrl: '',
});
assert.equal(profile2.username, 'noface');       // falls back to username when displayName is empty
assert.equal(profile2.avatarUrl, DEFAULT_AVATAR_URL);
assert.equal(profile2.bio, 'Penggemar game Roblox.');
assert.equal(profile2.joinedDate, 'Bergabung 2026');
assert.deepEqual(profile2.favoriteGameIds, []);

// 3. buildUserProfile — default isVerifiedOwner to false
const profile3 = buildUserProfile({
  userId: 777,
  username: 'unverified',
  displayName: 'Unverified',
  avatarHeadshotUrl: 'https://example.com/unverified.png',
});
assert.equal(profile3.isRobloxVerified, false);

// 4. mergeUserProfile — merge server profile into existing user
const existing: UserProfile = {
  id: 'user-roblox-123',
  username: 'Old Name',
  handle: 'oldname',
  robloxUsername: 'oldname',
  avatarUrl: 'https://example.com/old.png',
  bio: 'Old bio',
  joinedDate: '2024-01-01',
  favoriteGameIds: ['gameA'],
};
const merged = mergeUserProfile(existing, {
  username: 'New Name',
  bio: 'Updated bio',
  favoriteGameIds: ['gameB', 'gameC'],
});
assert.equal(merged.id, 'user-roblox-123');
assert.equal(merged.username, 'New Name');
assert.equal(merged.handle, 'oldname');  // preserved from existing
assert.equal(merged.bio, 'Updated bio');
assert.deepEqual(merged.favoriteGameIds, ['gameB', 'gameC']);  // server takes priority

// 5. mergeUserProfile — when server has no favoriteGameIds, keep existing
const merged2 = mergeUserProfile(existing, { username: 'New2' });
assert.deepEqual(merged2.favoriteGameIds, ['gameA']);  // preserved from existing

// 6. mergeUserProfile — null existing returns server profile as UserProfile
const merged3 = mergeUserProfile(null, {
  id: 'user-roblox-456',
  username: 'Brand New',
  favoriteGameIds: ['gameX'],
});
assert.equal(merged3.id, 'user-roblox-456');
assert.deepEqual(merged3.favoriteGameIds, ['gameX']);

// 7. mergeUserProfile — null existing with no favoriteGameIds returns empty array
const merged4 = mergeUserProfile(null, { username: 'Empty' });
assert.deepEqual(merged4.favoriteGameIds, []);

// 8. authHeaders is always empty object (no Authorization header from client)
const headers = authHeaders();
assert.equal(Object.keys(headers).length, 0);
assert.deepEqual(headers, {});

// 9. Constants
assert.equal(AUTH_CHANNEL, 'bloxboxd_auth');
assert.equal(AUTH_MESSAGE_TYPE, 'BLOXBOXD_AUTH_SUCCESS');

console.log('[Auth Test] All assertions passed successfully.');
