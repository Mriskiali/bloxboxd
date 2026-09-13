import { Game } from '../types';

export const GENRE_CATEGORIES = [
  'All',
  'Action',
  'RPG',
  'Shooter',
  'Survival',
  'Roleplay & Avatar Sim',
  'Simulation',
  'Strategy',
  'Obby & Platformer',
  'Party & Casual'
] as const;

export type GenreCategory = (typeof GENRE_CATEGORIES)[number];

/**
 * Strict, API-accurate genre category matching for Roblox experiences.
 * Evaluates ONLY official Roblox API genre metadata (genre, subgenre, genre_l1, genre_l2).
 * Eliminates keyword matching on game title and description to prevent false positives.
 */
export function isGameInGenreCategory(game: Game, category: string): boolean {
  if (!category || category === 'All') return true;

  const cat = category.toLowerCase().trim();
  const gL1 = (game.genre_l1 || '').toLowerCase().trim();
  const gL2 = (game.genre_l2 || '').toLowerCase().trim();
  const gGenre = (game.genre || '').toLowerCase().trim();
  const gSub = (game.subgenre || '').toLowerCase().trim();

  // 1. Direct match with any of the official API fields
  if (gL1 === cat || gGenre === cat || gL2 === cat || gSub === cat) return true;

  // 2. Canonical Roblox API genre taxonomy mapping (Strictly based on API fields)
  if (cat === 'action' || cat === 'action / fighting') {
    return (
      gL1 === 'action' ||
      gGenre === 'action' ||
      gGenre === 'fighting' ||
      gL2.includes('fighting') ||
      gSub.includes('fighting') ||
      gL2.includes('battleground') ||
      gSub.includes('battleground') ||
      gL2 === 'open world action' ||
      gSub === 'open world action'
    );
  }

  if (cat === 'rpg' || cat === 'adventure / rpg' || cat === 'adventure') {
    return (
      gL1 === 'rpg' ||
      gGenre === 'rpg' ||
      gGenre === 'adventure' ||
      gL2.includes('rpg') ||
      gSub.includes('rpg')
    );
  }

  if (cat === 'shooter' || cat === 'shooter / fps' || cat === 'fps') {
    return (
      gL1 === 'shooter' ||
      gGenre === 'shooter' ||
      gGenre === 'fps' ||
      gL2.includes('shooter') ||
      gSub.includes('shooter')
    );
  }

  if (cat === 'survival' || cat === 'horror') {
    return (
      gL1 === 'survival' ||
      gGenre === 'survival' ||
      gGenre === 'horror' ||
      gL2 === 'escape' ||
      gSub === 'escape' ||
      gL2 === '1 vs all' ||
      gSub === '1 vs all'
    );
  }

  if (cat === 'roleplay & avatar sim' || cat === 'social / roleplay' || cat === 'roleplay') {
    return (
      gL1 === 'roleplay & avatar sim' ||
      gL1 === 'shopping' ||
      gGenre === 'town and city' ||
      gGenre === 'roleplay' ||
      gGenre === 'shopping' ||
      gL2 === 'life' ||
      gSub === 'life' ||
      gL2 === 'dress up' ||
      gSub === 'dress up' ||
      gL2 === 'pet care' ||
      gSub === 'pet care' ||
      gL2.includes('avatar') ||
      gSub.includes('avatar')
    );
  }

  if (cat === 'simulation' || cat === 'simulator / tycoon') {
    return (
      gL1 === 'simulation' ||
      gGenre === 'simulation' ||
      gGenre === 'building' ||
      gL2.includes('simulator') ||
      gSub.includes('simulator') ||
      gL2 === 'tycoon' ||
      gSub === 'tycoon' ||
      gL2 === 'vehicle sim' ||
      gSub === 'vehicle sim' ||
      gL2 === 'sandbox' ||
      gSub === 'sandbox'
    );
  }

  if (cat === 'strategy' || cat === 'tower defense') {
    return (
      gL1 === 'strategy' ||
      gGenre === 'strategy' ||
      gL2 === 'tower defense' ||
      gSub === 'tower defense'
    );
  }

  if (cat === 'obby & platformer' || cat === 'obby / parkour') {
    return (
      gL1 === 'obby & platformer' ||
      gGenre === 'platformer' ||
      gL2 === 'tower obby' ||
      gSub === 'tower obby'
    );
  }

  if (cat === 'party & casual') {
    return (
      gL1 === 'party & casual' ||
      gGenre === 'party' ||
      gGenre === 'comedy' ||
      gL2 === 'minigame' ||
      gSub === 'minigame' ||
      gL2 === 'childhood game' ||
      gSub === 'childhood game'
    );
  }

  // 3. Fallback matching ONLY on official genre fields (no title/desc keyword searching)
  return (
    gGenre.includes(cat) ||
    gSub.includes(cat) ||
    gL1.includes(cat) ||
    gL2.includes(cat)
  );
}

/**
 * Normalizes Roblox API genre metadata into primary and subgenre strings.
 */
export function extractRobloxGenreMetadata(
  rawGenre?: string,
  genreL1?: string,
  genreL2?: string
): { genre: string; subgenre?: string; genre_l1?: string; genre_l2?: string } {
  const l1 = genreL1 && genreL1 !== 'All' ? genreL1.trim() : undefined;
  const l2 = genreL2 && genreL2 !== 'All' ? genreL2.trim() : undefined;
  const base = rawGenre && rawGenre !== 'All' && rawGenre !== 'Experience' ? rawGenre.trim() : undefined;

  const primaryGenre = l1 || base || 'Variety';
  const subgenre = l2 || (l1 && base && base !== l1 ? base : undefined);

  return {
    genre: primaryGenre,
    subgenre: subgenre || undefined,
    genre_l1: genreL1 || undefined,
    genre_l2: genreL2 || undefined
  };
}

/**
 * Legacy compatibility wrapper for inferRobloxGenre.
 * Does not perform keyword guessing on game title/description.
 */
export function inferRobloxGenre(
  name: string,
  desc: string = '',
  rawGenre?: string
): { genre: string; tags: string[] } {
  const meta = extractRobloxGenreMetadata(rawGenre);
  return {
    genre: meta.genre,
    tags: ['roblox', meta.genre.toLowerCase()]
  };
}
