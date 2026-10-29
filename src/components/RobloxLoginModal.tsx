import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Lock, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { safeAvatarSrc } from '../types';

export const RobloxLoginModal: React.FC = () => {
  const { 
    loginModalOpen, 
    setLoginModalOpen, 
    user, 
    logoutRobloxAccount,
    language,
    t 
  } = useApp();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!loginModalOpen) return null;

  const handleOAuthLogin = () => {
    setIsAuthenticating(true);
    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/api/auth/roblox/login',
      'roblox_oauth',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      window.location.href = '/api/auth/roblox/login';
      return;
    }

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setIsAuthenticating(false);
      }
    }, 800);
  };

  const handleLogout = () => {
    logoutRobloxAccount();
    setLoginModalOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={() => setLoginModalOpen(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md rounded-[3px] bg-panel border border-line p-6 shadow-[0_16px_36px_rgba(0,0,0,0.65)] space-y-6 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[3px] bg-green/10 border border-green/20 text-green">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('login_modal_title')}
              </h3>
              <p className="text-[11px] text-muted">
                {language === 'id' ? 'Masuk via Roblox resmi' : 'Official Roblox sign in'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setLoginModalOpen(false)}
            className="text-muted hover:text-white p-1 rounded-[2px] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged in state */}
        {user ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-[3px] bg-bg border border-line">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={safeAvatarSrc(user.avatarUrl)}
                  alt={user.username}
                  className="w-12 h-12 rounded-[3px] object-cover border border-line flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">{user.username}</p>
                    {user.isRobloxVerified && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-green bg-green/10 px-1.5 py-0.5 rounded-[2px] border border-green/20">
                        {t('nav_verified')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    @{user.robloxUsername || user.username} {user.robloxUserId ? `(ID: ${user.robloxUserId})` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('login_modal_logout_btn')}</span>
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed text-center">
              {language === 'id' 
                ? 'Akun kamu terhubung secara aman dengan Roblox OAuth 2.0.' 
                : 'Your account is securely linked with Roblox OAuth 2.0.'}
            </p>
          </div>
        ) : (
          /* Logged out state: 1-Click Roblox OAuth */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-ink leading-relaxed">
                {language === 'id'
                  ? 'Masuk pakai akun Roblox kamu. Cukup satu klik tanpa perlu password atau repot ubah bio.'
                  : 'Sign in with your Roblox account in one click. No passwords, no PINs, no hassle.'}
              </p>
            </div>

            {/* Big Action Button */}
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={handleOAuthLogin}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-[3px] bg-[#00A2FF] hover:bg-[#008fe0] disabled:opacity-70 text-white font-bold text-xs tracking-wide transition-all shadow-[0_4px_16px_rgba(0,162,255,0.3)] hover:shadow-[0_6px_20px_rgba(0,162,255,0.45)] cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'id' ? 'Menghubungkan...' : 'Connecting...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('login_modal_oauth_btn')}</span>
                </>
              )}
            </button>

            {/* Perks / Security guarantees */}
            <div className="pt-3 border-t border-line space-y-2 text-xs text-muted">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-medium">{language === 'id' ? 'Resmi:' : 'Official:'}</strong>{' '}
                  {language === 'id' ? 'Otorisasi langsung lewat server Roblox (apis.roblox.com).' : 'Handled directly by official Roblox servers.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-medium">{language === 'id' ? 'Tanpa Password:' : 'Password-Free:'}</strong>{' '}
                  {language === 'id' ? 'Password dan akun kamu tetap aman di pihak Roblox.' : 'Your credentials stay strictly with Roblox.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-medium">{language === 'id' ? 'Otomatis:' : 'Automatic:'}</strong>{' '}
                  {language === 'id' ? 'Avatar, username, dan koleksi game langsung terhubung.' : 'Avatar, username, and diary sync right away.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
