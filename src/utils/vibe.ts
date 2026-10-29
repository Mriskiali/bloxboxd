import { Game } from '../types';

export type PlayStyle = 'all' | 'solo' | 'coop' | 'pvp';
export type FocusedCategory = 'all' | 'horror' | 'fps' | 'cozy' | 'story' | 'hidden-gem';

export interface PlayStyleOption {
  id: PlayStyle;
  labelId: string;
  labelEn: string;
  iconName: 'Gamepad2' | 'User' | 'Users' | 'Swords';
  descId: string;
  descEn: string;
}

export interface FocusedCategoryOption {
  id: FocusedCategory;
  labelId: string;
  labelEn: string;
  iconName: 'Sparkles' | 'Ghost' | 'Crosshair' | 'Coffee' | 'Compass' | 'Gem';
  badgeId: string;
  badgeEn: string;
  descId: string;
  descEn: string;
}

export const PLAY_STYLES: PlayStyleOption[] = [
  {
    id: 'all',
    labelId: 'Bebas',
    labelEn: 'Any',
    iconName: 'Gamepad2',
    descId: 'Semua gaya main',
    descEn: 'Any play style'
  },
  {
    id: 'solo',
    labelId: 'Sendiri (Solo)',
    labelEn: 'Solo',
    iconName: 'User',
    descId: 'Story, puzzle, obby, dan eksplorasi santai',
    descEn: 'Stories, puzzles, obbies, and immersive campaigns'
  },
  {
    id: 'coop',
    labelId: 'Mabar Teman',
    labelEn: 'With Friends',
    iconName: 'Users',
    descId: 'Horor co-op, survival bareng, dan minigame seru',
    descEn: 'Survival horror, co-op adventures, and party games'
  },
  {
    id: 'pvp',
    labelId: 'Adu Skill / PvP',
    labelEn: 'Competitive',
    iconName: 'Swords',
    descId: 'Shooter, duel mekanik, dan battleground',
    descEn: 'Shooters, duels, and battleground arenas'
  }
];

export const FOCUSED_CATEGORIES: FocusedCategoryOption[] = [
  {
    id: 'all',
    labelId: 'Semua Genre',
    labelEn: 'All Genres',
    iconName: 'Sparkles',
    badgeId: 'Pilihan Terbaik',
    badgeEn: 'Top Pick',
    descId: 'Koleksi game pilihan dari berbagai genre.',
    descEn: 'Curated mix of solid experiences across all genres.'
  },
  {
    id: 'horror',
    labelId: 'Horor & Survival',
    labelEn: 'Horror & Survival',
    iconName: 'Ghost',
    badgeId: 'Horor Asli',
    badgeEn: 'True Horror',
    descId: 'Game horor atmosferik dan escape survival murni.',
    descEn: 'Atmospheric horror and escape survival without spam.'
  },
  {
    id: 'fps',
    labelId: 'Tembak-tembakan / FPS',
    labelEn: 'Shooters / FPS',
    iconName: 'Crosshair',
    badgeId: 'Mekanik Senjata',
    badgeEn: 'Gunplay',
    descId: 'Shooter taktis dengan aim dan recoil responsif.',
    descEn: 'Tactical shooters with tight gunplay and responsive aim.'
  },
  {
    id: 'cozy',
    labelId: 'Santai & Hangout',
    labelEn: 'Chill & Hangout',
    iconName: 'Coffee',
    badgeId: 'Santai',
    badgeEn: 'Relaxing',
    descId: 'Eksplorasi estetik, hangout bareng, dan roleplay santai.',
    descEn: 'Aesthetic worlds, social spots, and relaxed sims.'
  },
  {
    id: 'story',
    labelId: 'Story & Petualangan',
    labelEn: 'Adventure & Story',
    iconName: 'Compass',
    badgeId: 'Alur Cerita',
    badgeEn: 'Story Campaign',
    descId: 'Game yang punya dunia luas, misi, atau bisa ditamatkan.',
    descEn: 'Rich worlds with quests, exploration, or clear endings.'
  },
  {
    id: 'hidden-gem',
    labelId: 'Hidden Gems',
    labelEn: 'Hidden Gems',
    iconName: 'Gem',
    badgeId: 'Rating Tinggi',
    badgeEn: 'High Rating',
    descId: 'Rating komunitas tinggi tapi belum terlalu ramai pemain.',
    descEn: 'High community ratings without being crowded or overhyped.'
  }
];

/**
 * Strict filtering based on canonical Roblox API taxonomy:
 * Evaluates genre_l1, genre_l2, subgenre, genre, and verified tags.
 * Excludes user description keyword stuffing.
 */
export function isGameMatchingFocus(
  game: Game,
  style: PlayStyle,
  cat: FocusedCategory
): boolean {
  const g1 = (game.genre_l1 || '').toLowerCase();
  const g2 = (game.genre_l2 || '').toLowerCase();
  const sub = (game.subgenre || '').toLowerCase();
  const g = (game.genre || '').toLowerCase();
  const tags = (game.tags || []).map(t => t.toLowerCase());

  // 1. Strict Category Matching
  if (cat === 'horror') {
    const isHorrorTaxonomy = 
      g1 === 'survival' || 
      g === 'survival' || 
      sub === 'escape' || 
      g2 === 'escape' || 
      sub === 'horror' ||
      g2 === 'horror' ||
      tags.includes('horror') ||
      tags.includes('escape') ||
      game.name.toLowerCase().includes('doors') ||
      game.name.toLowerCase().includes('pressure');
    if (!isHorrorTaxonomy) return false;
  } else if (cat === 'fps') {
    const isFpsTaxonomy = 
      g1 === 'shooter' || 
      g === 'shooter' || 
      sub === 'fps' || 
      g2 === 'fps' || 
      tags.includes('shooter') || 
      tags.includes('fps') ||
      game.name.toLowerCase().includes('rivals') ||
      game.name.toLowerCase().includes('frontlines');
    if (!isFpsTaxonomy) return false;
  } else if (cat === 'cozy') {
    const isCozyTaxonomy = 
      g1 === 'roleplay & avatar sim' || 
      g === 'roleplay & avatar sim' || 
      sub === 'life' || 
      sub === 'dress up' || 
      tags.includes('social---fashion') || 
      tags.includes('avatar') ||
      tags.includes('roleplay');
    if (!isCozyTaxonomy) return false;
  } else if (cat === 'story') {
    const isStoryTaxonomy = 
      g1 === 'rpg' || 
      g === 'rpg' || 
      g1 === 'action' ||
      sub.includes('rpg') || 
      sub.includes('adventure') ||
      tags.includes('rpg') || 
      tags.includes('adventure');
    if (!isStoryTaxonomy) return false;
  } else if (cat === 'hidden-gem') {
    const totalVotes = (game.upVotes || 0) + (game.downVotes || 0);
    const likeRatio = totalVotes > 0 ? (game.upVotes || 0) / totalVotes : 0;
    const isHighQuality = game.ratingAverage >= 4.2 || likeRatio >= 0.85;
    const isUnderrated = (game.playerCount || 0) >= 30 && (game.playerCount || 0) <= 9000;
    if (!isHighQuality || !isUnderrated) return false;
  }

  // 2. Play Style Matching
  if (style === 'solo') {
    const isMultiplayerOnly = g1 === 'party & casual' && sub === 'minigame';
    if (isMultiplayerOnly) return false;
  } else if (style === 'coop') {
    const isCoopFriendly = 
      g1 === 'survival' || 
      g1 === 'party & casual' || 
      g1 === 'roleplay & avatar sim' || 
      tags.includes('multiplayer') ||
      cat === 'horror' ||
      cat === 'cozy';
    if (!isCoopFriendly) return false;
  } else if (style === 'pvp') {
    const isPvp = 
      g1 === 'shooter' || 
      g1 === 'action' || 
      g.includes('fighting') || 
      sub.includes('battleground') || 
      sub.includes('fps') ||
      tags.includes('shooter') ||
      tags.includes('action');
    if (!isPvp) return false;
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

  window.location.href = protocolUrl;

  setTimeout(() => {
    if (!document.hidden) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1200);
}
