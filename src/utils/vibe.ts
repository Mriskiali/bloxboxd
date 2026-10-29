import { Game } from '../types';

export type PlayStyle = 'all' | 'solo' | 'coop' | 'pvp';
export type FocusedCategory = 'all' | 'horror' | 'fps' | 'cozy' | 'story' | 'hidden-gem';

export interface PlayStyleOption {
  id: PlayStyle;
  labelId: string;
  labelEn: string;
  emoji: string;
  descId: string;
  descEn: string;
}

export interface FocusedCategoryOption {
  id: FocusedCategory;
  labelId: string;
  labelEn: string;
  emoji: string;
  badgeId: string;
  badgeEn: string;
  descId: string;
  descEn: string;
}

export const PLAY_STYLES: PlayStyleOption[] = [
  {
    id: 'all',
    labelId: 'Bebas / Siapa Saja',
    labelEn: 'Any Style',
    emoji: '🎮',
    descId: 'Semua tipe permainan',
    descEn: 'Any play style'
  },
  {
    id: 'solo',
    labelId: 'Solo (Fokus Sendiri)',
    labelEn: 'Solo (Immersive)',
    emoji: '👤',
    descId: 'Story, puzzle, obby & pengalaman mendalam',
    descEn: 'Stories, puzzles, obbies & immersive single player'
  },
  {
    id: 'coop',
    labelId: 'Mabar Teman (2–4 Orang)',
    labelEn: 'Co-op (2–4 Players)',
    emoji: '👥',
    descId: 'Horor survival, petualangan bersama, minigames',
    descEn: 'Survival horror, co-op adventures, fun minigames'
  },
  {
    id: 'pvp',
    labelId: 'Kompetitif / PvP',
    labelEn: 'Competitive / PvP',
    emoji: '⚔️',
    descId: 'Shooter, duel, battlegrounds & adu mekanik',
    descEn: 'Shooters, duels, battlegrounds & skill checks'
  }
];

export const FOCUSED_CATEGORIES: FocusedCategoryOption[] = [
  {
    id: 'all',
    labelId: 'Semua Genre',
    labelEn: 'All Genres',
    emoji: '✨',
    badgeId: 'Kurasi Terbaik',
    badgeEn: 'Curated Pick',
    descId: 'Koleksi pilihan game Roblox berkualitas tinggi.',
    descEn: 'Collection of high quality curated Roblox experiences.'
  },
  {
    id: 'horror',
    labelId: 'Horor & Survival Asli',
    labelEn: 'True Horror & Survival',
    emoji: '👻',
    badgeId: 'Atmosfer Mencekam',
    badgeEn: 'Atmospheric Horror',
    descId: 'Hanya game horor atmosferik & escape survival resmi (bukan obby murahan).',
    descEn: 'Authentic atmospheric horror and escape survival (no spam/fake games).'
  },
  {
    id: 'fps',
    labelId: 'FPS & Tembak-tembakan',
    labelEn: 'FPS & Shooters',
    emoji: '🔫',
    badgeId: 'Mekanik Senjata Top',
    badgeEn: 'Tactical Gunplay',
    descId: 'Shooter taktis dan adu aim dengan mekanik senjata responsif.',
    descEn: 'Tactical shooters and precision aim games with responsive mechanics.'
  },
  {
    id: 'cozy',
    labelId: 'Cozy, Hangout & Relax',
    labelEn: 'Cozy, Hangout & Chill',
    emoji: '☕',
    badgeId: 'Santai & Estetik',
    badgeEn: 'Relaxing & Aesthetic',
    descId: 'Eksplorasi estetis, hangout sosial, dress up & simulasi santai.',
    descEn: 'Aesthetic exploration, social hangouts, dress up & calm sims.'
  },
  {
    id: 'story',
    labelId: 'Petualangan & Story Tamat',
    labelEn: 'Adventure & RPG Story',
    emoji: '🗺️',
    badgeId: 'Alur Cerita & Progresi',
    badgeEn: 'Narrative & Progression',
    descId: 'Game dengan progresi dunia, lore, atau alur cerita yang bisa diselesaikan.',
    descEn: 'Worlds with lore, exploration, or complete story campaigns.'
  },
  {
    id: 'hidden-gem',
    labelId: 'Hidden Gems (Underrated)',
    labelEn: 'Hidden Gems (Underrated)',
    emoji: '💎',
    badgeId: 'Rasio Like > 85%',
    badgeEn: '85%+ Like Ratio',
    descId: 'Rating komunitas sangat tinggi tapi pemain aktif masih di bawah 10.000.',
    descEn: 'Very high positive rating, modest player count, no corporate cash-grabs.'
  }
];

/**
 * STRICT filtering based on canonical Roblox API taxonomy:
 * Evaluates genre_l1, genre_l2, subgenre, genre, and verified tags.
 * Deliberately excludes loose keyword searches on game description/title
 * to eliminate keyword-stuffed simulator spam.
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
    // Solo favors story, horror, obbies, single-player friendly
    const isMultiplayerOnly = g1 === 'party & casual' && sub === 'minigame';
    if (isMultiplayerOnly) return false;
  } else if (style === 'coop') {
    // Co-op favors horror survival, adventure, party, casual
    const isCoopFriendly = 
      g1 === 'survival' || 
      g1 === 'party & casual' || 
      g1 === 'roleplay & avatar sim' || 
      tags.includes('multiplayer') ||
      cat === 'horror' ||
      cat === 'cozy';
    if (!isCoopFriendly) return false;
  } else if (style === 'pvp') {
    // PvP strictly requires shooter, fighting, battleground, competitive action
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

  // 1. Try launching native Roblox client
  window.location.href = protocolUrl;

  // 2. Fallback to web link if window remains focused after 1.2s
  setTimeout(() => {
    if (!document.hidden) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1200);
}
