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
    badgeId: 'Koleksi Lengkap',
    badgeEn: 'Full Collection',
    descId: 'Semua game dari berbagai penjuru Roblox tanpa batas rating atau pemain.',
    descEn: 'All experiences across Roblox with zero rating or player caps.'
  },
  {
    id: 'horror',
    labelId: 'Horor & Survival',
    labelEn: 'Horror & Survival',
    iconName: 'Ghost',
    badgeId: 'Horor',
    badgeEn: 'Horror',
    descId: 'Game horor, escape room, survival, dan misteri.',
    descEn: 'Horror, escape rooms, survival, and mystery.'
  },
  {
    id: 'fps',
    labelId: 'Tembak-tembakan / FPS',
    labelEn: 'Shooters / FPS',
    iconName: 'Crosshair',
    badgeId: 'Shooter',
    badgeEn: 'Shooter',
    descId: 'Adu tembak, mekanik senjata, dan arena tempur.',
    descEn: 'Gunplay, tactical shooters, and combat arenas.'
  },
  {
    id: 'cozy',
    labelId: 'Santai & Hangout',
    labelEn: 'Chill & Hangout',
    iconName: 'Coffee',
    badgeId: 'Santai',
    badgeEn: 'Relaxing',
    descId: 'Dunia estetik, hangout bareng, dress up, dan roleplay.',
    descEn: 'Aesthetic worlds, social spots, and relaxed sims.'
  },
  {
    id: 'story',
    labelId: 'Story & Petualangan',
    labelEn: 'Adventure & Story',
    iconName: 'Compass',
    badgeId: 'Story',
    badgeEn: 'Adventure',
    descId: 'Game berelemen petualangan, quest, cerita, atau dungeon.',
    descEn: 'Rich worlds with quests, exploration, or clear campaigns.'
  },
  {
    id: 'hidden-gem',
    labelId: 'Hidden Gems & Niche',
    labelEn: 'Hidden Gems & Niche',
    iconName: 'Gem',
    badgeId: 'Niche',
    badgeEn: 'Niche',
    descId: 'Game tersembunyi, indie eksperimental, atau server kecil yang sepi.',
    descEn: 'Hidden experiments, quiet servers, and indie gems.'
  }
];

/**
 * Open matching: No gatekeeping on ratings, visits, or active player counts.
 * Checks theme and play style so users can discover small, weird, new, or unrated games too.
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

  // 1. Category Matching (Broad & Inclusive)
  if (cat === 'horror') {
    const isHorror = 
      g1 === 'survival' || 
      g === 'survival' || 
      sub.includes('escape') || 
      g2.includes('escape') || 
      sub.includes('horror') ||
      g2.includes('horror') ||
      tags.includes('horror') ||
      tags.includes('escape') ||
      tags.includes('survival') ||
      game.name.toLowerCase().includes('doors') ||
      game.name.toLowerCase().includes('pressure') ||
      game.name.toLowerCase().includes('horror');
    if (!isHorror) return false;
  } else if (cat === 'fps') {
    const isFps = 
      g1 === 'shooter' || 
      g === 'shooter' || 
      sub.includes('fps') || 
      g2.includes('fps') || 
      tags.includes('shooter') || 
      tags.includes('fps') ||
      game.name.toLowerCase().includes('rivals') ||
      game.name.toLowerCase().includes('frontlines') ||
      game.name.toLowerCase().includes('gun');
    if (!isFps) return false;
  } else if (cat === 'cozy') {
    const isCozy = 
      g1.includes('roleplay') || 
      g.includes('roleplay') || 
      sub.includes('life') || 
      sub.includes('dress up') || 
      sub.includes('avatar') ||
      tags.includes('social---fashion') || 
      tags.includes('avatar') ||
      tags.includes('roleplay') ||
      tags.includes('hangout');
    if (!isCozy) return false;
  } else if (cat === 'story') {
    const isStory = 
      g1.includes('rpg') || 
      g.includes('rpg') || 
      g1.includes('action') ||
      sub.includes('rpg') || 
      sub.includes('adventure') ||
      tags.includes('rpg') || 
      tags.includes('adventure') ||
      tags.includes('story');
    if (!isStory) return false;
  } else if (cat === 'hidden-gem') {
    // Hidden gems / niche: smaller player base (<= 15,000) so big frontpage monoliths don't drown them out
    const isSmallServer = (game.playerCount || 0) <= 15000;
    if (!isSmallServer) return false;
  }

  // 2. Play Style Matching
  if (style === 'solo') {
    const isMultiplayerOnly = g1 === 'party & casual' && sub === 'minigame';
    if (isMultiplayerOnly) return false;
  } else if (style === 'coop') {
    const isCoop = 
      g1 === 'survival' || 
      g1 === 'party & casual' || 
      g1.includes('roleplay') || 
      tags.includes('multiplayer') ||
      cat === 'horror' ||
      cat === 'cozy' ||
      cat === 'all';
    if (!isCoop) return false;
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
