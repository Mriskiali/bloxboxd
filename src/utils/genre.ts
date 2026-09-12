import { Game } from '../types';

export const GENRE_CATEGORIES = [
  'All',
  'Horror',
  'Action / Fighting',
  'Adventure / RPG',
  'Social / Roleplay',
  'Shooter / FPS',
  'Obby / Parkour',
  'Simulator / Tycoon',
  'Tower Defense'
] as const;

export type GenreCategory = (typeof GENRE_CATEGORIES)[number];

/**
 * Robust, user-intuitive genre category matching for Roblox experiences.
 * Matches by primary genre, tags, game title, and content keywords.
 */
export function isGameInGenreCategory(game: Game, category: string): boolean {
  if (!category || category === 'All') return true;

  const genre = (game.genre || '').toLowerCase();
  const name = (game.name || '').toLowerCase();
  const tags = Array.isArray(game.tags) ? game.tags.map(t => (t || '').toLowerCase()) : [];
  const desc = (game.description || '').toLowerCase();
  const fullText = `${genre} ${tags.join(' ')} ${name} ${desc}`;

  switch (category) {
    case 'Horror':
      return (
        genre.includes('horror') ||
        tags.some(t => t.includes('horror') || t.includes('scary') || t.includes('creepy') || t === 'ftf' || t === 'mm2') ||
        /horror|scary|jumpscare|creepy|flee the facility|the mimic|doors|pressure|evade|piggy|apeirophobia|dead silence|granny|slender|dandy's world|dandys world|rainbow friends|survival---mystery/i.test(fullText) ||
        name.includes('doors') ||
        name.includes('mimic') ||
        name.includes('pressure') ||
        name.includes('evade') ||
        name.includes('piggy') ||
        name.includes('flee the facility') ||
        name.includes('murder mystery') ||
        name.includes('3008') ||
        name.includes('apeirophobia') ||
        name.includes('dandy')
      );

    case 'Action / Fighting':
      return (
        (
          genre.includes('action') ||
          genre.includes('fighting') ||
          genre.includes('arena') ||
          genre.includes('chaos') ||
          genre.includes('sandbox') ||
          genre.includes('brawler') ||
          tags.some(t => t.includes('pvp') || t.includes('fighting') || t.includes('combat') || t.includes('brawl') || t.includes('action')) ||
          /battleground|combat|fighting|sword|brawl|duel|slap battles|blade ball|jujutsu|da hood|item asylum|strongest battleground/i.test(fullText) ||
          name.includes('battleground') ||
          name.includes('jujutsu') ||
          name.includes('slap battles') ||
          name.includes('blade ball') ||
          name.includes('combat warriors') ||
          name.includes('da hood') ||
          name.includes('item asylum')
        ) && !genre.includes('tower defense') && !tags.some(t => t.includes('tower-defense'))
      );

    case 'Adventure / RPG':
      return (
        genre.includes('rpg') ||
        genre.includes('adventure') ||
        genre.includes('dungeon') ||
        genre.includes('quest') ||
        tags.some(t => t.includes('rpg') || t.includes('adventure') || t.includes('quest') || t.includes('dungeon')) ||
        /deepwoken|blox fruits|fisch|grand piece|king legacy|rogue lineage|build a boat|type:\/\/soul|open world rpg|anime rpg|souls-like/i.test(fullText) ||
        name.includes('deepwoken') ||
        name.includes('blox fruits') ||
        name.includes('fisch') ||
        name.includes('grand piece') ||
        name.includes('king legacy') ||
        name.includes('rogue lineage') ||
        name.includes('build a boat') ||
        name.includes('type://soul')
      );

    case 'Social / Roleplay':
      return (
        genre.includes('social') ||
        genre.includes('roleplay') ||
        genre.includes('fashion') ||
        genre.includes('avatar') ||
        genre.includes('pets') ||
        genre.includes('fantasy') ||
        genre.includes('reality tv') ||
        genre.includes('police') ||
        tags.some(t => t.includes('roleplay') || t.includes('social') || t === 'rp' || t.startsWith('rp-') || t.includes('fashion') || t.includes('dti') || t.includes('avatar')) ||
        /brookhaven|berry avenue|bloxburg|adopt me|dress to impress|royale high|catalog avatar|emergency response|meepcity|livetopia|town and city|life rp/i.test(fullText) ||
        name.includes('brookhaven') ||
        name.includes('berry avenue') ||
        name.includes('bloxburg') ||
        name.includes('adopt me') ||
        name.includes('dress to impress') ||
        name.includes('royale high') ||
        name.includes('catalog avatar') ||
        name.includes('emergency response')
      );

    case 'Shooter / FPS':
      return (
        genre.includes('fps') ||
        genre.includes('shooter') ||
        genre.includes('tactical') ||
        genre.includes('gun') ||
        tags.some(t => t.includes('fps') || t.includes('shooter') || t.includes('gun') || t.includes('tactical')) ||
        /fps|shooter|tactical shooter|sniper|rivals|arsenal|phantom forces|frontlines|gun fight/i.test(fullText) ||
        name.includes('rivals') ||
        name.includes('arsenal') ||
        name.includes('phantom forces') ||
        name.includes('frontlines')
      );

    case 'Obby / Parkour':
      return (
        genre.includes('obby') ||
        genre.includes('platformer') ||
        genre.includes('speedrun') ||
        genre.includes('parkour') ||
        tags.some(t => t.includes('obby') || t.includes('platformer') || t.includes('parkour') || t.includes('speedrun')) ||
        /tower of hell|speed run|obby|parkour|obstacle course|difficulty chart/i.test(fullText) ||
        name.includes('tower of hell') ||
        name.includes('speed run') ||
        name.includes('obby')
      );

    case 'Simulator / Tycoon':
      return (
        (
          genre.includes('simulator') ||
          genre.includes('tycoon') ||
          genre.includes('collecting') ||
          genre.includes('management') ||
          tags.some(t => t.includes('simulator') || t.includes('tycoon') || t === 'sim' || t.includes('pet-sim')) ||
          /pet simulator|bee swarm|theme park tycoon|lumber tycoon|work at a pizza place|mining simulator|idle tycoon|factory tycoon/i.test(fullText) ||
          name.includes('pet simulator') ||
          name.includes('bee swarm') ||
          name.includes('theme park') ||
          name.includes('lumber tycoon') ||
          name.includes('work at a pizza place')
        ) && !genre.includes('adventure / simulation')
      );

    case 'Tower Defense':
      return (
        genre.includes('tower defense') ||
        genre.includes('strategy / defense') ||
        genre.includes('defense') ||
        tags.some(t => t.includes('tower-defense') || t.includes('tds') || t.includes('td') || t.includes('strategy')) ||
        /tower defense|anime defenders|anime last stand|tower heroes|all star tower defense|anime vanguards|tds/i.test(fullText) ||
        name.includes('tower defense') ||
        name.includes('anime defenders') ||
        name.includes('anime last stand') ||
        name.includes('tower heroes') ||
        name.includes('all star tower defense') ||
        name.includes('anime vanguards')
      );

    default:
      return (
        genre.includes(category.toLowerCase()) ||
        tags.some(t => t.includes(category.toLowerCase())) ||
        name.toLowerCase().includes(category.toLowerCase())
      );
  }
}

/**
 * Analyzes Roblox game metadata (title, description, and raw genre from API)
 * and determines a clean, human-readable genre category and relevant tags.
 */
export function inferRobloxGenre(
  name: string,
  desc: string = '',
  rawGenre?: string
): { genre: string; tags: string[] } {
  const g = (rawGenre || '').trim();
  const text = `${name} ${desc}`.toLowerCase();

  // If already specific from Roblox API
  if (/^horror$/i.test(g)) return { genre: 'Horror', tags: ['roblox', 'horror'] };
  if (/^(fps|shooter)$/i.test(g)) return { genre: 'FPS / Shooter', tags: ['roblox', 'fps', 'shooter'] };
  if (/^(rpg|roleplaying)$/i.test(g)) return { genre: 'Adventure / RPG', tags: ['roblox', 'rpg', 'adventure'] };
  if (/^(action|fighting|brawler)$/i.test(g)) return { genre: 'Action / Fighting', tags: ['roblox', 'action', 'fighting'] };
  if (/^(simulation|simulator)$/i.test(g)) return { genre: 'Simulator / Tycoon', tags: ['roblox', 'simulator'] };
  if (/^(roleplay|town and city)$/i.test(g)) return { genre: 'Social / Roleplay', tags: ['roblox', 'roleplay', 'social'] };
  if (/^(platformer|obby)$/i.test(g)) return { genre: 'Obby / Parkour', tags: ['roblox', 'obby', 'parkour'] };

  // Infer from content and title
  if (/horror|scary|jumpscare|creepy|flee the facility|mimic|doors|pressure|evade|piggy|apeirophobia|dead silence|granny|slender|dandy|survival horror/i.test(text)) {
    return { genre: 'Horror', tags: ['roblox', 'horror', 'survival'] };
  }
  if (/\b(fps|shooter|guns?|sniper|tactical shooter|arsenal|aim|frontlines|phantom forces)\b/i.test(text)) {
    return { genre: 'FPS / Shooter', tags: ['roblox', 'fps', 'shooter', 'gun'] };
  }
  if (/\b(tower defense|tds|all star tower defense|anime defenders|anime last stand|anime vanguards)\b/i.test(text)) {
    return { genre: 'Tower Defense', tags: ['roblox', 'tower-defense', 'strategy'] };
  }
  if (/\b(obby|parkour|speedrun|speed run|obstacle course|tower of hell)\b/i.test(text)) {
    return { genre: 'Obby / Parkour', tags: ['roblox', 'obby', 'parkour', 'platformer'] };
  }
  if (/\b(tycoon|factory|industry)\b/i.test(text)) {
    return { genre: 'Simulator / Tycoon', tags: ['roblox', 'tycoon', 'simulation'] };
  }
  if (/\b(simulator|pet sim|mining simulator|swarms?)\b/i.test(text)) {
    return { genre: 'Simulator / Tycoon', tags: ['roblox', 'simulator', 'collecting'] };
  }
  if (/\b(roleplay|rp|brookhaven|berry avenue|bloxburg|adopt me|royale high|dress to impress|fashion|meepcity|hangout|high school|town and city)\b/i.test(text)) {
    return { genre: 'Social / Roleplay', tags: ['roblox', 'roleplay', 'social', 'rp'] };
  }
  if (/\b(battleground|battlegrounds|pvp|fighting|brawl|slap battles|blade ball|combat|arena|jujutsu|duel)\b/i.test(text)) {
    return { genre: 'Action / Fighting', tags: ['roblox', 'action', 'fighting', 'pvp'] };
  }
  if (/\b(rpg|dungeon|quest|open world|deepwoken|fisch|piece|rogue lineage|souls-like|anime rpg)\b/i.test(text)) {
    return { genre: 'Adventure / RPG', tags: ['roblox', 'rpg', 'adventure', 'open-world'] };
  }
  if (/\b(racing|driving|cars?|drift|speedway|cdid)\b/i.test(text)) {
    return { genre: 'Racing / Driving', tags: ['roblox', 'racing', 'driving', 'cars'] };
  }

  const fallbackGenre = g && g !== 'All' && g !== 'Experience' ? g : 'Adventure / RPG';
  return { genre: fallbackGenre, tags: ['roblox', 'experience'] };
}
