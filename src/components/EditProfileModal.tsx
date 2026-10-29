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
    getGameById,
    language,
    t 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75  overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-xl bg-panel border border-line rounded-[3px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.55)] space-y-5 my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-green" />
            <h3 className="bb-label">{t('edit_profile_title')}</h3>
          </div>
          <button 
            onClick={() => setEditProfileModalOpen(false)}
            className="text-muted hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connect Roblox Account banner */}
        <div className="bg-bg border border-line rounded-[3px] p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 bg-green transform -rotate-12 rounded-[2px]" />
            <div className="text-xs">
              <p className="font-bold text-white">{t('edit_profile_roblox_official')}</p>
              <p className="text-[11px] text-muted">
                {user.robloxUserId 
                  ? (language === 'id' ? `Terhubung: @${user.robloxUsername}` : `Connected: @${user.robloxUsername}`) 
                  : (language === 'id' ? 'Login untuk sinkronisasi avatar & username otomatis' : 'Sign in to automatically sync avatar & username')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditProfileModalOpen(false);
              setLoginModalOpen(true);
            }}
            className="px-3 py-1.5 bg-blue hover:bg-blue text-white text-xs font-bold rounded-[2px] transition-colors shadow"
          >
            {user.robloxUserId ? t('nav_switch_account') : t('nav_login_roblox')}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar preview and Roblox sync */}
          <div className="flex items-center gap-4 bg-bg p-3.5 rounded-[3px] border border-line">
            <img
              src={safeAvatarSrc(avatarUrl)}
              alt="Avatar"
              className="w-16 h-16 rounded-[3px] object-cover border border-green"
            />
            <div className="flex-1 space-y-1.5">
              <span className="text-xs font-bold text-ink">{t('edit_profile_avatar_url')}</span>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-panel border border-line rounded-[2px] px-2.5 py-1 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleFetchRobloxAvatar}
                disabled={fetchingAvatar}
                className="text-[11px] text-green hover:underline font-semibold flex items-center gap-1"
              >
                {fetchingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>{t('edit_profile_fetch_avatar')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink mb-1">
                {t('edit_profile_display_name')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-panel border border-line rounded-[2px] px-3 py-2 text-xs text-white focus:border-green outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink mb-1">
                {t('edit_profile_roblox_name')}
              </label>
              <input
                type="text"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                className="w-full bg-panel border border-line rounded-[2px] px-3 py-2 text-xs text-white focus:border-green outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink mb-1">
              {t('edit_profile_bio')}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('edit_profile_bio_ph')}
              className="w-full bg-panel border border-line rounded-[2px] px-3 py-2 text-xs text-white focus:border-green outline-none"
            />
          </div>

          {/* 4 Favorite Experiences Selector (PRD Section 3.4 & 6.2 #3) */}
          <div className="pt-2 border-t border-line">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-[0.08em] text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-green fill-green" />
                <span>{t('edit_profile_favs')} ({favoriteGameIds.length}/4)</span>
              </label>
            </div>

            {/* Current 4 slots */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[0, 1, 2, 3].map(slot => {
                const gameId = favoriteGameIds[slot];
                const game = gameId ? getGameById(gameId) : null;

                if (game) {
                  return (
                    <div key={slot} className="relative group rounded-[2px] overflow-hidden border border-line aspect-square">
                      <img src={safeImgSrc(game.iconUrl)} alt={game.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(game.id)}
                        className="absolute top-1 right-1 p-1 bg-[#0a0e12]/85 hover:bg-orange rounded text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-[#0a0e12]/85 p-1 text-[9px] text-white truncate text-center">
                        #{slot + 1} {game.name}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={slot} className="rounded-[2px] border border-dashed border-line bg-bg aspect-square flex items-center justify-center text-xs text-faint font-mono">
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
              placeholder={t('edit_profile_search_ph')}
              className="w-full bg-bg border border-line rounded-[2px] px-3 py-1.5 text-xs text-white mb-2"
            />

            <div className="max-h-36 overflow-y-auto space-y-1 bg-bg p-2 rounded-[3px] border border-line">
              {games
                .filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                .map(g => {
                  const isFav = favoriteGameIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleFavorite(g.id)}
                      className={`flex items-center justify-between p-1.5 rounded-[2px] cursor-pointer text-xs ${
                        isFav ? 'bg-green/20 text-white' : 'hover:bg-panel-2 text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={safeImgSrc(g.iconUrl)} alt={g.name} className="w-6 h-6 rounded object-cover" />
                        <span className="font-semibold">{g.name}</span>
                      </div>
                      {isFav && <Star className="w-3.5 h-3.5 text-green fill-green" />}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-white"
            >
              {t('edit_profile_cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-black bg-green hover:bg-[#00c94b] rounded-[2px] transition-colors"
            >
              {t('edit_profile_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
