import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Copy, 
  CheckCircle2, 
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Shirt,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { safeAvatarSrc } from '../types';

interface RobloxUserData {
  userId: number;
  username: string;
  displayName: string;
  hasVerifiedBadge: boolean;
  description: string;
  created: string;
  joinedYear?: number;
  friendsCount: number;
  avatarHeadshotUrl: string;
  avatarBustUrl?: string;
}

interface AccountStatus {
  registered: boolean;
  hasPin: boolean;
  username?: string;
  verifiedAt?: string;
}

interface ActiveChallengeData {
  challengeId: string;
  type: 'bio' | 'avatar';
  phrase?: string;
  words?: string[];
  assetId?: number;
  assetName?: string;
  catalogUrl?: string;
  avatarEditorUrl?: string;
  availableItems?: Array<{ id: number; name: string; catalogUrl: string }>;
  action?: 'equip' | 'unequip';
  actionInstruction?: string;
  expiresInSeconds: number;
}

export const RobloxLoginModal: React.FC = () => {
  const { 
    loginModalOpen, 
    setLoginModalOpen, 
    user, 
    loginWithRobloxAccount, 
    logoutRobloxAccount 
  } = useApp();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<RobloxUserData | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [selectedAvatarType, setSelectedAvatarType] = useState<'headshot' | 'bust'>('headshot');

  // Mode for existing registered accounts: 'pin' | 'challenge'
  const [pinMode, setPinMode] = useState<'pin' | 'challenge'>('pin');
  const [inputPin, setInputPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Challenge System
  const [challengeType, setChallengeType] = useState<'avatar' | 'bio'>('avatar');
  const [challengeData, setChallengeData] = useState<ActiveChallengeData | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ success: boolean; message: string } | null>(null);

  // Timer countdown effect for active challenge
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!loginModalOpen) return null;

  const startVerificationChallenge = async (targetUser: RobloxUserData, type: 'avatar' | 'bio', preferredItemId?: number) => {
    setChallengeLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch('/api/roblox/account/challenge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser.userId,
          type,
          preferredItemId
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setChallengeData(data);
        setChallengeType(type);
        setCountdown(data.expiresInSeconds || 240);
      } else {
        setFeedbackMessage({
          success: false,
          message: data?.error || data?.message || 'Gagal memulai sesi verifikasi. Silakan coba lagi.'
        });
      }
    } catch (e) {
      setFeedbackMessage({
        success: false,
        message: 'Gagal menghubungi server untuk sesi verifikasi.'
      });
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setFoundUser(null);
    setAccountStatus(null);
    setChallengeData(null);
    setFeedbackMessage(null);
    setInputPin('');
    setNewPin('');
    setConfirmPin('');

    try {
      // 1. Lookup Roblox User via live Roblox API proxy
      const userRes = await fetch(`/api/roblox/user/lookup?q=${encodeURIComponent(q)}`);
      const userData = await userRes.json();

      if (!userRes.ok || !userData.success || !userData.user) {
        setError(userData.error || 'Akun Roblox tidak ditemukan. Pastikan username atau ID valid.');
        setLoading(false);
        return;
      }

      setFoundUser(userData.user);

      // 2. Check Bloxboxd protection status for this account
      try {
        const statusRes = await fetch(`/api/roblox/account/status?userId=${userData.user.userId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setAccountStatus(statusData);
          if (statusData.hasPin) {
            setPinMode('pin');
          } else {
            setPinMode('challenge');
            // Auto start challenge session
            startVerificationChallenge(userData.user, 'avatar');
          }
        } else {
          setPinMode('challenge');
          startVerificationChallenge(userData.user, 'avatar');
        }
      } catch (e) {
        setPinMode('challenge');
        startVerificationChallenge(userData.user, 'avatar');
      }
    } catch (err) {
      setError('Gagal menghubungi server Roblox. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPhrase = () => {
    if (!challengeData?.phrase) return;
    navigator.clipboard.writeText(challengeData.phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Login with PIN for already claimed accounts
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser || !inputPin.trim()) return;

    setVerifying(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/roblox/account/login-with-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: foundUser.userId,
          pin: inputPin.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage({ success: true, message: 'Autentikasi berhasil! Selamat datang kembali.' });
        setTimeout(() => {
          loginWithRobloxAccount({
            userId: foundUser.userId,
            username: foundUser.username,
            displayName: foundUser.displayName,
            avatarHeadshotUrl: selectedAvatarType === 'bust' && foundUser.avatarBustUrl ? foundUser.avatarBustUrl : foundUser.avatarHeadshotUrl,
            avatarBustUrl: foundUser.avatarBustUrl,
            description: foundUser.description,
            created: foundUser.created,
            friendsCount: foundUser.friendsCount,
            isVerifiedOwner: true
          });
          setLoginModalOpen(false);
        }, 600);
      } else {
        setFeedbackMessage({
          success: false,
          message: data.message || 'PIN Keamanan salah! Akun ini dilindungi sehingga orang lain tidak dapat menggunakannya.'
        });
      }
    } catch (e) {
      setFeedbackMessage({ success: false, message: 'Gagal menghubungi server untuk autentikasi PIN.' });
    } finally {
      setVerifying(false);
    }
  };

  // Submit active challenge verification & register account with PIN
  const handleVerifyChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser || !challengeData) return;

    if (!newPin.trim() || newPin.trim().length < 4) {
      setFeedbackMessage({ success: false, message: 'PIN Keamanan harus minimal 4 angka untuk melindungi akun kamu.' });
      return;
    }

    if (newPin !== confirmPin) {
      setFeedbackMessage({ success: false, message: 'Konfirmasi PIN tidak cocok dengan PIN yang dimasukkan.' });
      return;
    }

    setVerifying(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/roblox/account/challenge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          userId: foundUser.userId,
          username: foundUser.username,
          pin: newPin.trim()
        })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setFeedbackMessage({ 
          success: true, 
          message: 'Verifikasi kepemilikan berhasil! Akun kamu kini resmi terdaftar dan terkunci aman dengan PIN.' 
        });

        setTimeout(() => {
          loginWithRobloxAccount({
            userId: foundUser.userId,
            username: foundUser.username,
            displayName: foundUser.displayName,
            avatarHeadshotUrl: selectedAvatarType === 'bust' && foundUser.avatarBustUrl ? foundUser.avatarBustUrl : foundUser.avatarHeadshotUrl,
            avatarBustUrl: foundUser.avatarBustUrl,
            description: foundUser.description,
            created: foundUser.created,
            friendsCount: foundUser.friendsCount,
            isVerifiedOwner: true
          });
          setLoginModalOpen(false);
        }, 1000);
      } else {
        setFeedbackMessage({
          success: false,
          message: data?.message || data?.error || 'Verifikasi belum terpenuhi. Pastikan instruksi tantangan sudah diterapkan pada akun Roblox kamu.'
        });
      }
    } catch (e) {
      setFeedbackMessage({ success: false, message: 'Koneksi terputus saat memverifikasi. Silakan coba klik verifikasi lagi.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    logoutRobloxAccount();
    setLoginModalOpen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isCurrentRobloxUser = Boolean(user?.robloxUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-lg bg-[#181e24] border border-[#2c3746] rounded-2xl shadow-2xl p-5 sm:p-6 my-6 max-h-[92vh] overflow-y-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242d38] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E59B]/10 border border-[#00E59B]/30 flex items-center justify-center">
              <span className="w-3.5 h-3.5 bg-[#00E59B] transform -rotate-12 rounded-[2px]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>Login Akun Roblox</span>
                <span className="text-[10px] bg-[#00E59B] text-black font-extrabold px-1.5 py-0.2 rounded">
                  Resmi & Aman
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Hubungkan identitas Roblox aslimu tanpa risiko pembajakan akun
              </p>
            </div>
          </div>
          <button 
            onClick={() => setLoginModalOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently Connected User Card (if any) */}
        {user && isCurrentRobloxUser && (
          <div className="bg-[#12161b] border border-[#242e3a] rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={safeAvatarSrc(user.avatarUrl)}
                alt={user.username}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#00E59B]"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{user.username}</p>
                  {user.isRobloxVerified && (
                    <span className="text-[9px] bg-[#00E59B]/20 text-[#00E59B] px-1.5 py-0.2 rounded font-bold">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  Akun aktif: @{user.robloxUsername} (ID: {user.robloxUserId})
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        )}

        {/* Search Input Form */}
        <form onSubmit={(e) => handleSearch(e)} className="space-y-2">
          <label className="block text-xs font-bold text-gray-300">
            Cari Akun Roblox Kamu
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="Username Roblox atau User ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-[#14181c] border border-[#2c3746] focus:border-[#00E59B] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-[#00E59B] hover:bg-[#00c988] disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              <span>Cari Akun</span>
            </button>
          </div>
        </form>

        {/* Error alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Found User Profile Preview & Authentication Form */}
        {foundUser && (
          <div className="bg-[#14181c] border border-[#2b3746] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            {/* User Identity Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <img
                  src={safeAvatarSrc(selectedAvatarType === 'bust' && foundUser.avatarBustUrl ? foundUser.avatarBustUrl : foundUser.avatarHeadshotUrl)}
                  alt={foundUser.username}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-black/60 border-2 border-[#00E59B] shadow-lg"
                />
                {foundUser.hasVerifiedBadge && (
                  <div className="absolute -bottom-1 -right-1 bg-[#00A2FF] text-white p-1 rounded-full shadow" title="Roblox Verified">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-white truncate">
                    {foundUser.displayName}
                  </h3>
                  <span className="text-xs font-mono text-gray-400 bg-[#1e252e] px-2 py-0.5 rounded border border-white/5">
                    @{foundUser.username}
                  </span>
                  {accountStatus?.hasPin ? (
                    <span className="text-[10px] font-bold text-[#00E59B] bg-[#00E59B]/10 px-2 py-0.5 rounded border border-[#00E59B]/30 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Akun Terdaftar & Terkunci</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Belum Terdaftar (Klaim Pemilik)</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>ID: <strong className="text-gray-200">{foundUser.userId}</strong></span>
                  {foundUser.joinedYear && (
                    <>
                      <span>•</span>
                      <span>Bergabung {foundUser.joinedYear}</span>
                    </>
                  )}
                  {foundUser.friendsCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{foundUser.friendsCount} Teman</span>
                    </>
                  )}
                </p>

                <div className="flex items-center gap-3 mt-2.5">
                  <a
                    href={`https://www.roblox.com/users/${foundUser.userId}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#00E59B] hover:underline font-semibold"
                  >
                    <span>Buka profil Roblox.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {foundUser.avatarBustUrl && (
                    <div className="flex items-center gap-1 text-[11px] bg-[#1e252f] p-0.5 rounded-lg border border-[#2b3745]">
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarType('headshot')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          selectedAvatarType === 'headshot' ? 'bg-[#00E59B] text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Headshot
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarType('bust')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                          selectedAvatarType === 'bust' ? 'bg-[#00E59B] text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        3D Avatar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback alert if any */}
            {feedbackMessage && (
              <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                feedbackMessage.success 
                  ? 'bg-[#00E59B]/10 border-[#00E59B]/30 text-[#00E59B]' 
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {feedbackMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00E59B] flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <span>{feedbackMessage.message}</span>
              </div>
            )}

            {/* CASE 1: Account Already Registered & Protected by PIN */}
            {accountStatus?.hasPin && pinMode === 'pin' && (
              <form onSubmit={handlePinLogin} className="border-t border-[#232b36] pt-4 space-y-3.5">
                <div className="bg-[#11151a] p-3 rounded-xl border border-[#26313f] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Lock className="w-4 h-4 text-[#00E59B]" />
                    <span>Akun Dilindungi PIN Keamanan</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Akun ini telah terdaftar dan dilindungi. Masukkan PIN Keamanan akun kamu untuk masuk. Orang lain tidak dapat masuk tanpa PIN ini.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Masukkan PIN Keamanan Kamu
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      autoFocus
                      autoComplete="current-password"
                      aria-label="PIN akun"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#1b222a] border border-[#2c3746] focus:border-[#00E59B] rounded-xl text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || !inputPin.trim()}
                  className="w-full py-3 bg-[#00E59B] hover:bg-[#00c988] active:scale-[0.99] disabled:opacity-50 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memeriksa PIN...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Masuk dengan PIN Keamanan</span>
                    </>
                  )}
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode('challenge');
                      setFeedbackMessage(null);
                      startVerificationChallenge(foundUser, 'avatar');
                    }}
                    className="text-xs text-gray-400 hover:text-[#00A2FF] underline transition-colors"
                  >
                    Lupa PIN? Verifikasi ulang kepemilikan akun untuk ganti PIN
                  </button>
                </div>
              </form>
            )}

            {/* CASE 2: First-time Registration OR Reset PIN via Active Challenge */}
            {(!accountStatus?.hasPin || pinMode === 'challenge') && (
              <div className="border-t border-[#232b36] pt-4 space-y-4">
                <div className="bg-[#101419] p-3.5 rounded-xl border border-[#26313f] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-[#00E59B]" />
                      <span>Sesi Verifikasi Kepemilikan Asli (Anti-Bypass)</span>
                    </div>
                    {countdown > 0 && (
                      <span className="text-[11px] font-mono text-[#00E59B] bg-[#00E59B]/10 border border-[#00E59B]/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(countdown)}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Sistem menggunakan sesi challenge dinamis berbatas waktu. Tidak ada yang bisa menebak atau menyalahgunakan akunmu. Pilih metode verifikasi di bawah:
                  </p>
                </div>

                {/* Method Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#101419] rounded-xl border border-[#252f3d]">
                  <button
                    type="button"
                    onClick={() => {
                      if (challengeType !== 'avatar') {
                        startVerificationChallenge(foundUser, 'avatar');
                      }
                    }}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      challengeType === 'avatar'
                        ? 'bg-[#00E59B] text-black shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-[#18202a]'
                    }`}
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Tantangan Avatar (0% Sensor)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (challengeType !== 'bio') {
                        startVerificationChallenge(foundUser, 'bio');
                      }
                    }}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      challengeType === 'bio'
                        ? 'bg-[#00E59B] text-black shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-[#18202a]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Frasa Bio Dinamis</span>
                  </button>
                </div>

                {/* Loading state for challenge */}
                {challengeLoading && (
                  <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00E59B]" />
                    <span>Menghubungi server Roblox untuk membuat sesi tantangan unik...</span>
                  </div>
                )}

                {/* Challenge Body */}
                {!challengeLoading && challengeData && (
                  <div className="space-y-4">
                    {/* Method 1: Avatar Item Challenge */}
                    {challengeType === 'avatar' && (
                      <div className="bg-[#12171e] p-4 rounded-xl border border-[#273240] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Shirt className="w-4 h-4 text-[#00E59B]" />
                            <span>Instruksi Avatar Editor (Bebas Sensor Kata)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => startVerificationChallenge(foundUser, 'avatar')}
                            className="text-[11px] text-gray-400 hover:text-[#00E59B] flex items-center gap-1"
                            title="Perbarui sesi"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Perbarui Sesi</span>
                          </button>
                        </div>

                        <div className="bg-[#19212b] p-3.5 rounded-lg border border-[#2f3d4e] space-y-2.5">
                          <p className="text-xs text-gray-200 leading-relaxed font-medium">
                            {challengeData.actionInstruction}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-gray-400 border-t border-white/5">
                            <div>
                              <span>Item Resmi: </span>
                              <strong className="text-white">{challengeData.assetName}</strong>{' '}
                              <span className="text-gray-400 font-mono text-[10px]">(ID: {challengeData.assetId})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <a
                                href={challengeData.catalogUrl || `https://www.roblox.com/catalog/${challengeData.assetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00A2FF] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>Lihat di Catalog (0 Robux)</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <a
                                href="https://www.roblox.com/my/avatar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00E59B] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>Buka Avatar Editor</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Switch item option if available */}
                        {challengeData.availableItems && challengeData.availableItems.length > 1 && (
                          <div className="flex items-center justify-between pt-0.5 text-[11px] text-gray-400">
                            <span>Ganti item tantangan lain:</span>
                            <div className="flex gap-1.5">
                              {challengeData.availableItems.map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => startVerificationChallenge(foundUser, 'avatar', item.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                    challengeData.assetId === item.id 
                                      ? 'bg-[#00E59B] text-black' 
                                      : 'bg-[#1a222c] hover:bg-[#25303e] text-gray-300'
                                  }`}
                                >
                                  {item.name === "ROBLOX 'R' Baseball Cap" ? "'R' Baseball Cap" : "Roblox Baseball Cap"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Item ini adalah topi resmi Roblox berharga <strong>0 Robux</strong> (Gratis). Jika belum kamu miliki di inventori, klik <strong>Lihat di Catalog (0 Robux)</strong> untuk mengklaimnya dalam 1 detik, pasang/lepas di Avatar Editor, lalu klik verifikasi.
                        </p>
                      </div>
                    )}

                    {/* Method 2: Dynamic Bio Words Challenge */}
                    {challengeType === 'bio' && (
                      <div className="bg-[#12171e] p-4 rounded-xl border border-[#273240] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Sparkles className="w-4 h-4 text-[#00E59B]" />
                            <span>Frasa 4 Kata Acak Sesi Ini</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => startVerificationChallenge(foundUser, 'bio')}
                            className="text-[11px] text-gray-400 hover:text-[#00E59B] flex items-center gap-1"
                            title="Buat sesi baru"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Acak Ulang</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-[#182029] px-3 py-2.5 rounded-xl border border-[#303e50]">
                          <span className="font-mono text-sm font-black text-[#00E59B] tracking-wide truncate select-all">
                            {challengeData.phrase}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPhrase}
                            className="flex items-center gap-1 text-xs font-bold text-gray-200 hover:text-white bg-[#263342] hover:bg-[#324255] px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#00E59B]" />
                                <span className="text-[#00E59B]">Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Frasa</span>
                              </>
                            )}
                          </button>
                        </div>

                        <ol className="text-[11px] text-gray-300 space-y-1 pl-4 list-decimal">
                          <li>Salin frasa 4 kata di atas.</li>
                          <li>Tempelkan sementara ke kolom <strong>About / Bio</strong> di profil Roblox kamu, lalu klik Save.</li>
                          <li>Buat PIN Keamanan di bawah dan klik Verifikasi. (Setelah terverifikasi, kamu bebas menghapus kembali frasa dari bio kamu).</li>
                        </ol>
                      </div>
                    )}

                    {/* PIN Registration Form */}
                    <form onSubmit={handleVerifyChallenge} className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#11161d] p-3 rounded-xl border border-[#242d38]">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-gray-300">
                            Buat PIN Keamanan Akun
                          </label>
                          <div className="relative">
                            <input
                              type={showPin ? 'text' : 'password'}
                              autoComplete="new-password"
                              aria-label="PIN Keamanan Baru"
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value)}
                              className="w-full px-3 py-2 bg-[#1b222a] border border-[#2c3746] focus:border-[#00E59B] rounded-lg text-xs text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-gray-300">
                            Konfirmasi PIN Keamanan
                          </label>
                          <input
                            type={showPin ? 'text' : 'password'}
                            autoComplete="new-password"
                            aria-label="Konfirmasi PIN"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1b222a] border border-[#2c3746] focus:border-[#00E59B] rounded-lg text-xs text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={verifying || !newPin.trim() || countdown === 0}
                        className="w-full py-3 bg-[#00E59B] hover:bg-[#00c988] active:scale-[0.99] disabled:opacity-50 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memeriksa ke Server Roblox...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verifikasi Kepemilikan & Kunci Akun Saya</span>
                          </>
                        )}
                      </button>

                      {accountStatus?.hasPin && (
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPinMode('pin');
                              setFeedbackMessage(null);
                            }}
                            className="text-xs text-gray-400 hover:text-white underline"
                          >
                            Sudah ingat PIN? Masuk dengan PIN saja
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
