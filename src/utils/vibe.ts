import { Game } from '../types';

export type VibeType = 'all' | 'horror' | 'cozy' | 'hidden-gem' | 'high-production' | 'competitive';

export interface VibeDefinition {
  id: VibeType;
  labelId: string;
  labelEn: string;
  emoji: string;
  badgeId: string;
  badgeEn: string;
  descId: string;
  descEn: string;
}

export const VIBES: VibeDefinition[] = [
  {
    id: 'all',
    labelId: 'Semua Suasana',
    labelEn: 'All Vibes',
    emoji: '✨',
    badgeId: 'Kurasi Pilihan',
    badgeEn: 'Curated Pick',
    descId: 'Rekomendasi acak game Roblox dengan rating komunitas tinggi.',
    descEn: 'Random recommendation of high-rated Roblox experiences.'
  },
  {
    id: 'horror',
    labelId: 'Horor Mabar',
    labelEn: 'Co-op Horror',
    emoji: '👻',
    badgeId: 'Atmosferik & Tegang',
    badgeEn: 'Spooky & Intense',
    descId: 'Game horor seru dengan atmosfer mencekam, cocok dimainkan bareng teman.',
    descEn: 'Thrilling horror games with chilling atmospheres, best played with friends.'
  },
  {
    id: 'cozy',
    labelId: 'Cozy & Santai',
    labelEn: 'Cozy & Chill',
    emoji: '☕',
    badgeId: 'Santai Tanpa Tekanan',
    badgeEn: 'Relaxing & Aesthetic',
    descId: 'Pengalaman santai, eksplorasi indah, dan simulasi tanpa kompetisi toxic.',
    descEn: 'Calm exploration, aesthetic worlds, and chill sims without competitive stress.'
  },
  {
    id: 'hidden-gem',
    labelId: 'Hidden Gems',
    labelEn: 'Hidden Gems',
    emoji: '💎',
    badgeId: 'Underrated Berkualitas',
    badgeEn: 'High-Rated Underrated',
    descId: 'Game berkualitas tinggi dengan rating komunitas tinggi tapi belum terlalu mainstream.',
    descEn: 'High quality games with great like ratios that deserve way more attention.'
  },
  {
    id: 'high-production',
    labelId: 'Grafis & Mekanik Top',
    labelEn: 'High Production',
    emoji: '🏆',
    badgeId: 'Standar Standalone',
    badgeEn: 'Masterpiece Quality',
    descId: 'Game dengan visual, animasi, dan kedalaman gameplay sekelas game PC mandiri.',
    descEn: 'Experiences with visuals, sound design, and depth rivaling standalone PC titles.'
  },
  {
    id: 'competitive',
    labelId: 'Kompetitif & PvP',
    labelEn: 'Competitive & PvP',
    emoji: '⚔️',
    badgeId: 'Skill-Based & Adrenalin',
    badgeEn: 'Fast-Paced Action',
    descId: 'Action cepat, shooter skill-based, dan arena tempur yang menantang.',
    descEn: 'Fast-paced shooters, battlegrounds, and skill-based multiplayer combat.'
  }
];

export function isGameMatchingVibe(game: Game, vibe: VibeType): boolean {
  if (vibe === 'all') return true;

  const g = (game.genre || '').toLowerCase();
  const sub = (game.subgenre || '').toLowerCase();
  const l1 = (game.genre_l1 || '').toLowerCase();
  const l2 = (game.genre_l2 || '').toLowerCase();
  const name = (game.name || '').toLowerCase();
  const desc = (game.description || '').toLowerCase();
  const text = `${g} ${sub} ${l1} ${l2} ${name} ${desc}`;

  if (vibe === 'horror') {
    return text.includes('horror') || 
           text.includes('scary') || 
           text.includes('survival') || 
           text.includes('ghost') || 
           text.includes('monster') || 
           text.includes('escape') ||
           sub.includes('horror');
  }

  if (vibe === 'cozy') {
    return text.includes('roleplay') || 
           text.includes('hangout') || 
           text.includes('cafe') || 
           text.includes('vibes') || 
           text.includes('chill') || 
           text.includes('avatar') || 
           text.includes('simulation') || 
           text.includes('house') ||
           g.includes('roleplay');
  }

  if (vibe === 'hidden-gem') {
    // High rating, good upvotes, but player count is modest (< 10k)
    const isHighRating = game.ratingAverage >= 4.2 || ((game.upVotes || 0) / Math.max(1, (game.upVotes || 0) + (game.downVotes || 0))) >= 0.85;
    const isNotOverhyped = (game.playerCount || 0) < 10000;
    return isHighRating && isNotOverhyped;
  }

  if (vibe === 'high-production') {
    return game.ratingAverage >= 4.4 || 
           text.includes('story') || 
           text.includes('fps') || 
           text.includes('cinematic') || 
           (game.rawVisits || 0) > 50_000_000;
  }

  if (vibe === 'competitive') {
    return text.includes('shooter') || 
           text.includes('fps') || 
           text.includes('pvp') || 
           text.includes('fighting') || 
           text.includes('battleground') || 
           text.includes('battle') || 
           text.includes('arena') ||
           g.includes('shooter') || 
           g.includes('action');
  }

  return true;
}

/**
 * Launch Roblox experience directly via native application protocol,
 * falling back to official Roblox web URL if app is unavailable.
 */
export function launchRobloxExperience(rootPlaceId: number): void {
  const protocolUrl = `roblox://experiences/start?placeId=${rootPlaceId}`;
  const webUrl = `https://www.roblox.com/games/${rootPlaceId}`;

  // 1. Try launching native Roblox client
  window.location.href = protocolUrl;

  // 2. Fallback to web link if window remains focused after 1.2s
  setTimeout(() => {
    if (!document.hidden) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1200);
}
