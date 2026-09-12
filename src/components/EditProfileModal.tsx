import React, { useState } from 'react';
import { X, User, Check, Sparkles, Loader2, Star, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { safeImgSrc, safeAvatarSrc } from '../types';

export const EditProfileModal: React.FC = () => {
  const { 
    editProfileModalOpen, 
    setEditProfileModalOpen, 
    setLoginModalOpen,
    user, 
    updateUserProfile, 
    games, 
    getGameById 
  } = useApp();

  const [username, setUsername] = useState(user?.username || '');
  const [robloxUsername, setRobloxUsername] = useState(user?.robloxUsername || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [favoriteGameIds, setFavoriteGameIds] = useState<string[]>(user?.favoriteGameIds || []);
  const [fetchingAvatar, setFetchingAvatar] = useState(false);
  const [gameSearch, setGameSearch] = useState('');

  if (!editProfileModalOpen || !user) return null;

  const handleFetchRobloxAvatar = async () => {
    if (!robloxUsername.trim()) return;
    setFetchingAvatar(true);
    try {
      const res = await fetch(`/api/roblox/avatar?username=${encodeURIComponent(robloxUsername.trim())}`);
      const data = await res.json();
      if (data.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
      }
    } catch (e) {
      console.warn('Could not fetch Roblox avatar:', e);
    } finally {
      setFetchingAvatar(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      username: username.trim() || user.username,
      robloxUsername: robloxUsername.trim() || user.robloxUsername,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim() || user.avatarUrl,
      favoriteGameIds
    });
    setEditProfileModalOpen(false);
  };

  const toggleFavorite = (gameId: string) => {
    if (favoriteGameIds.includes(gameId)) {
      setFavoriteGameIds(prev => prev.filter(id => id !== gameId));
    } else {
      if (favoriteGameIds.length >= 4) {
        // replace last or don't allow
        setFavoriteGameIds(prev => [...prev.slice(0, 3), gameId]);
      } else {
        setFavoriteGameIds(prev => [...prev, gameId]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-xl bg-[#181e24] border border-[#2b3542] rounded-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#232b35] pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00E59B]" />
            <h3 className="text-lg font-bold text-white">Edit Profile & The 4 Favorites</h3>
          </div>
          <button 
            onClick={() => setEditProfileModalOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connect Roblox Account banner */}
        <div className="bg-[#12161b] border border-[#252f3c] rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 bg-[#00E59B] transform -rotate-12 rounded-[2px]" />
            <div className="text-xs">
              <p className="font-bold text-white">Akun Roblox Resmi</p>
              <p className="text-[11px] text-gray-400">
                {user.robloxUserId ? `Terhubung: @${user.robloxUsername}` : 'Login untuk sinkronisasi avatar & username otomatis'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditProfileModalOpen(false);
              setLoginModalOpen(true);
            }}
            className="px-3 py-1.5 bg-[#00A2FF] hover:bg-[#008fe6] text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            {user.robloxUserId ? 'Ganti Akun' : 'Login Roblox'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar preview and Roblox sync */}
          <div className="flex items-center gap-4 bg-[#14181c] p-3.5 rounded-xl border border-[#242d38]">
            <img
              src={safeAvatarSrc(avatarUrl)}
              alt="Avatar"
              className="w-16 h-16 rounded-xl object-cover border border-[#00E59B]"
            />
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-bold text-gray-300">Avatar Image URL</span>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleFetchRobloxAvatar}
                disabled={fetchingAvatar}
                className="text-[11px] text-[#00E59B] hover:underline font-semibold flex items-center gap-1"
              >
                {fetchingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Fetch headshot using Roblox Username</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Bloxboxd Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00E59B] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Roblox Username
              </label>
              <input
                type="text"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00E59B] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Bio & Gaming Motto
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00E59B] outline-none"
            />
          </div>

          {/* 4 Favorite Experiences Selector (PRD Section 3.4 & 6.2 #3) */}
          <div className="pt-2 border-t border-[#232b35]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#00E59B] fill-[#00E59B]" />
                <span>Top 4 Favorite Experiences ({favoriteGameIds.length}/4)</span>
              </label>
            </div>

            {/* Current 4 slots */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[0, 1, 2, 3].map(slot => {
                const gameId = favoriteGameIds[slot];
                const game = gameId ? getGameById(gameId) : null;

                if (game) {
                  return (
                    <div key={slot} className="relative group rounded-lg overflow-hidden border border-[#2b3542] aspect-square">
                      <img src={safeImgSrc(game.iconUrl)} alt={game.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(game.id)}
                        className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 rounded text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1 text-[9px] text-white truncate text-center">
                        #{slot + 1} {game.name}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={slot} className="rounded-lg border border-dashed border-[#2b3542] bg-[#14181c] aspect-square flex items-center justify-center text-xs text-gray-500 font-mono">
                    Slot #{slot + 1}
                  </div>
                );
              })}
            </div>

            {/* Game search to pick favorites */}
            <input
              type="text"
              aria-label="Search experiences to pin as favorite"
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              className="w-full bg-[#14181c] border border-[#242d38] rounded-lg px-3 py-1.5 text-xs text-white mb-2"
            />

            <div className="max-h-36 overflow-y-auto space-y-1 bg-[#14181c] p-2 rounded-xl border border-[#242d38]">
              {games
                .filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                .map(g => {
                  const isFav = favoriteGameIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleFavorite(g.id)}
                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs ${
                        isFav ? 'bg-[#00E59B]/20 text-white' : 'hover:bg-[#1f2732] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={safeImgSrc(g.iconUrl)} alt={g.name} className="w-6 h-6 rounded object-cover" />
                        <span className="font-semibold">{g.name}</span>
                      </div>
                      {isFav && <Star className="w-3.5 h-3.5 text-[#00E59B] fill-[#00E59B]" />}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232b35]">
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-black bg-[#00E59B] hover:bg-[#00c988] rounded-lg transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
