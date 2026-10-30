import { Game } from '../types';

export type PlayStyle = 'all' | 'solo' | 'coop' | 'pvp';
export type FocusedCategory = 
  | 'all' 
  | 'action' 
  | 'horror' 
  | 'fps' 
  | 'tycoon' 
  | 'obby' 
  | 'strategy' 
  | 'cozy' 
  | 'story' 
  | 'hidden-gem';

export type DiscoveryStrategy = 'hits' | 'top-rated' | 'hidden-gem';

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
  iconName: 'Sparkles' | 'Flame' | 'Ghost' | 'Crosshair' | 'Coins' | 'Footprints' | 'Shield' | 'Coffee' | 'Compass' | 'Gem';
  badgeId: string;
  badgeEn: string;
  descId: string;
  descEn: string;
}

export interface StrategyOption {
  id: DiscoveryStrategy;
  labelId: string;
  labelEn: string;
  iconName: 'Flame' | 'Star' | 'Gem';
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
    descEn: 'Stories, puzzles, obbies, and campaigns'
  },
  {
    id: 'coop',
    labelId: 'Mabar Teman',
    labelEn: 'With Friends',
    iconName: 'Users',
    descId: 'Horor co-op, survival bareng, dan petualangan tim',
    descEn: 'Survival horror, co-op adventures, and squad play'
  },
  {
    id: 'pvp',
    labelId: 'Adu Skill (PvP)',
    labelEn: 'Competitive (PvP)',
    iconName: 'Swords',
    descId: 'Shooter, duel mekanik, dan battleground arena',
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
    descId: 'Semua game dari berbagai penjuru Roblox tanpa batas genre.',
    descEn: 'All experiences across Roblox with zero category caps.'
  },
  {
    id: 'action',
    labelId: 'Aksi & Anime',
    labelEn: 'Action & Anime',
    iconName: 'Flame',
    badgeId: 'Action',
    badgeEn: 'Action',
    descId: 'Battleground, duel anime, pertarungan mekanik cepat.',
    descEn: 'Anime battlegrounds, fast fighting, and boss encounters.'
  },
  {
    id: 'horror',
    labelId: 'Horor & Survival',
    labelEn: 'Horror & Survival',
    iconName: 'Ghost',
    badgeId: 'Horor',
    badgeEn: 'Horror',
    descId: 'Game horor, escape room, survival, dan misteri mencekam.',
    descEn: 'Horror, escape rooms, survival, and spine-chilling mysteries.'
  },
  {
    id: 'fps',
    labelId: 'Tembak-tembakan / FPS',
    labelEn: 'Shooters / FPS',
    iconName: 'Crosshair',
    badgeId: 'Shooter',
    badgeEn: 'Shooter',
    descId: 'Adu tembak, taktik senjata, dan arena tempur.',
    descEn: 'Gunplay, tactical shooters, and combat arenas.'
  },
  {
    id: 'tycoon',
    labelId: 'Simulator & Tycoon',
    labelEn: 'Simulator & Tycoon',
    iconName: 'Coins',
    badgeId: 'Tycoon',
    badgeEn: 'Tycoon',
    descId: 'Bangun kerajaan bisnis, grinding seru, dan simulasi santai.',
    descEn: 'Build your empire, satisfying progression, and cozy sims.'
  },
  {
    id: 'obby',
    labelId: 'Obby & Parkour',
    labelEn: 'Obby & Parkour',
    iconName: 'Footprints',
    badgeId: 'Obby',
    badgeEn: 'Obby',
    descId: 'Uji refleks, rintangan platformer, dan tower of hell.',
    descEn: 'Platformer challenges, reflex courses, and obstacle towers.'
  },
  {
    id: 'strategy',
    labelId: 'Tower Defense & Taktik',
    labelEn: 'Strategy & TD',
    iconName: 'Shield',
    badgeId: 'Strategy',
    badgeEn: 'Strategy',
    descId: 'Pasang unit, pertahankan markas, dan taktik cerdas.',
    descEn: 'Unit placement, base defense, and tactical battles.'
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
    labelId: 'Petualangan & RPG',
    labelEn: 'Adventure & RPG',
    iconName: 'Compass',
    badgeId: 'Story',
    badgeEn: 'Adventure',
    descId: 'Game berelemen petualangan, quest, cerita, atau dungeon.',
    descEn: 'Rich worlds with quests, exploration, and dungeons.'
  },
  {
    id: 'hidden-gem',
    labelId: 'Hidden Gems & Niche',
    labelEn: 'Hidden Gems & Niche',
    iconName: 'Gem',
    badgeId: 'Niche',
    badgeEn: 'Niche',
    descId: 'Game unik, indie eksperimental, dan server sepi berkualitas.',
    descEn: 'Hidden experiments, quiet servers, and indie gems.'
  }
];

export const DISCOVERY_STRATEGIES: StrategyOption[] = [
  {
    id: 'hits',
    labelId: 'Paling Populer',
    labelEn: 'Popular Hits',
    iconName: 'Flame',
    descId: 'Game terbukti seru dengan pemain aktif terbanyak.',
    descEn: 'Verified community favorites with high active players.'
  },
  {
    id: 'top-rated',
    labelId: 'Rating Tertinggi',
    labelEn: 'Top Rated',
    iconName: 'Star',
    descId: 'Persentase rating bintang dan like positif terbaik.',
    descEn: 'Experiences with the highest upvote percentages.'
  },
  {
    id: 'hidden-gem',
    labelId: 'Hidden Gems',
    labelEn: 'Hidden Gems',
    iconName: 'Gem',
    descId: 'Game indie berkualitas yang tidak ada di beranda umum.',
    descEn: 'Atmospheric, experimental, or niche games.'
  }
];

export function getRobloxQueryForVibe(cat: FocusedCategory, style: PlayStyle): string {
  if (style === 'pvp') {
    if (cat === 'fps') return 'tactical shooter fps deathmatch';
    if (cat === 'action') return 'anime fighting battleground duel';
    return 'pvp fighting battleground shooter arena';
  }

  if (style === 'coop') {
    if (cat === 'horror') return 'coop horror multiplayer escape';
    if (cat === 'strategy') return 'tower defense squad coop';
    if (cat === 'story') return 'coop adventure rpg quest';
    return 'coop multiplayer squad with friends';
  }

  if (style === 'solo') {
    if (cat === 'obby') return 'obby platformer difficulty chart';
    if (cat === 'story') return 'solo story campaign rpg adventure';
    if (cat === 'tycoon') return 'singleplayer tycoon idle simulator';
    return 'solo story campaign puzzle obby';
  }

  const categoryQueries: Record<FocusedCategory, string> = {
    'all': 'popular top multiplayer experiences',
    'action': 'anime action fighting battleground',
    'horror': 'horror survival scary escape',
    'fps': 'fps shooter gun combat',
    'tycoon': 'tycoon simulator business idle',
    'obby': 'obby parkour platformer',
    'strategy': 'tower defense strategy tactical',
    'cozy': 'roleplay life hangout chill avatar',
    'story': 'rpg adventure story quest dungeon',
    'hidden-gem': 'indie showcase aesthetic experimental'
  };

  return categoryQueries[cat] || categoryQueries.all;
}

export function isGameMatchingFocus(
  game: Game,
  style: PlayStyle,
  cat: FocusedCategory
): boolean {
  if (!game || !game.name) return false;

  const text = `${game.name} ${game.description || ''} ${game.genre || ''} ${game.genre_l1 || ''} ${game.genre_l2 || ''} ${game.subgenre || ''} ${(game.tags || []).join(' ')}`.toLowerCase();

  // 1. Category filter
  if (cat === 'horror') {
    if (!/horror|scary|survival|escape|spooky|creepy|fears|doors|pressure|ghost|anomaly|killer|mimic|haunted/.test(text)) return false;
  } else if (cat === 'action') {
    if (!/action|fighting|battleground|anime|sword|combat|arena|jujutsu|punch|duel|brawl|slayer|warrior/.test(text)) return false;
  } else if (cat === 'fps') {
    if (!/shooter|fps|gun|sniper|weapon|tactical|rivals|frontlines|arsenal|aim|deathmatch|recoil/.test(text)) return false;
  } else if (cat === 'tycoon') {
    if (!/tycoon|simulator|sim|factory|business|empire|worker|grind|mining|farm|clicker/.test(text)) return false;
  } else if (cat === 'obby') {
    if (!/obby|parkour|platformer|tower of|difficulty chart|jump|runner|obstacle|stages/.test(text)) return false;
  } else if (cat === 'strategy') {
    if (!/tower defense|strategy|tactics|defenders|tds|defense|conquer|units|battles|chess/.test(text)) return false;
  } else if (cat === 'cozy') {
    if (!/roleplay|hangout|chill|social|fashion|dress up|avatar|life|town|cafe|rp|relax|club/.test(text)) return false;
  } else if (cat === 'story') {
    if (!/rpg|adventure|story|quest|dungeon|explore|campaign|lore|deepwoken|world|magic/.test(text)) return false;
  } else if (cat === 'hidden-gem') {
    if ((game.playerCount || 0) > 25000) return false;
  }

  // 2. Play Style Filter
  if (style === 'pvp') {
    // Must contain combat, shooting, fighting, battle, or competitive elements
    const isPvp = /pvp|shooter|fps|gun|battle|fight|arena|combat|duel|versus|vs|war|kill|deathmatch|battleground|sword|brawl|arsenal|rivals|killstreak|combatants/.test(text)
      || cat === 'fps'
      || (cat === 'action' && !/peaceful|chill|hangout/.test(text));
    
    // Explicitly reject peaceful roleplay, dress-up, town & city from PvP
    if (!isPvp || /dress up|fashion show|baby|salon|peaceful roleplay/.test(text)) {
      return false;
    }
  } else if (style === 'solo') {
    // Reject pure 2-player mandatory games or pure team deathmatch arenas
    if (/2 player only|two player only|requires 2 players|duo required/.test(text)) {
      return false;
    }
    // Strongly matches campaign, story, obby, solo tycoon, puzzle, dungeon
    const isSoloFriendly = /solo|story|campaign|singleplayer|single-player|obby|puzzle|escape|tycoon|simulator|rpg|explore|journey|dungeon|adventure/.test(text)
      || ['obby', 'story', 'tycoon', 'hidden-gem'].includes(cat);
    if (!isSoloFriendly && /pure pvp|team deathmatch only|1v1 arena/.test(text)) {
      return false;
    }
  } else if (style === 'coop') {
    // Fits cooperative gameplay, survival, squads, friends, hangout
    const isCoop = /co-op|coop|multiplayer|friends|squad|party|hangout|roleplay|survival|dungeon|team|together|duo|trio|doors|pressure|evade|raid|waves|defend/.test(text)
      || ['horror', 'strategy', 'cozy', 'tycoon'].includes(cat);
    if (!isCoop && /solo only|singleplayer only|1v1 duel only/.test(text)) {
      return false;
    }
  }

  return true;
}

export function computeGameRecommendationScore(
  game: Game,
  cat: FocusedCategory,
  style: PlayStyle,
  strategy: DiscoveryStrategy,
  seed: number
): { score: number; reasonBadge: string; reasonBadgeEn: string; badgeIcon: 'Flame' | 'Star' | 'Gem' | 'Users' | 'Swords' | 'Award' } {
  let score = 0;
  const players = game.playerCount || 0;
  const rating = game.ratingAverage || 4.0;
  const rawVisits = game.rawVisits || 0;
  const totalVotes = (game.upVotes || 0) + (game.downVotes || 0);
  const upPct = totalVotes > 0 ? (game.upVotes || 0) / totalVotes : 0.85;

  const text = `${game.name} ${game.description || ''} ${game.genre || ''} ${game.subgenre || ''}`.toLowerCase();

  // Style affinity scoring
  if (style === 'pvp') {
    if (/pvp|shooter|battleground|arena|duel|fps/.test(text)) score += 30;
  } else if (style === 'coop') {
    if (/co-op|coop|multiplayer|squad|team|friends|survival/.test(text)) score += 30;
  } else if (style === 'solo') {
    if (/story|solo|campaign|obby|puzzle|singleplayer/.test(text)) score += 30;
  }

  // Strategy scoring
  if (strategy === 'hits') {
    score += Math.log10(players + 1) * 16;
    score += Math.log10(rawVisits + 1) * 6;
    score += upPct * 20;
  } else if (strategy === 'top-rated') {
    score += rating * 15;
    score += upPct * 35;
    score += Math.min(Math.log10(players + 1) * 6, 25);
  } else if (strategy === 'hidden-gem') {
    if (players >= 20 && players <= 6000) {
      score += 50;
    } else if (players > 6000 && players <= 18000) {
      score += 15;
    } else if (players > 25000) {
      score -= 30;
    }
    score += rating * 12;
    score += upPct * 25;
  }

  if (game.iconUrl && !game.iconUrl.includes('noFilter')) score += 8;
  if (game.bannerUrl) score += 6;

  // Temperature variation per shuffle
  const pseudo = Math.sin((game.universeId || 100) * 17 + seed * 31) * 10;
  score += pseudo;

  // Semantic badges without hardcoded emojis
  let reasonBadge = 'Pilihan Kurasi';
  let reasonBadgeEn = 'Curated Pick';
  let badgeIcon: 'Flame' | 'Star' | 'Gem' | 'Users' | 'Swords' | 'Award' = 'Award';

  if (style === 'pvp' && /arena|duel|battleground|pvp/.test(text)) {
    reasonBadge = 'Arena PvP Kompetitif';
    reasonBadgeEn = 'Competitive PvP Arena';
    badgeIcon = 'Swords';
  } else if (style === 'coop' && /coop|squad|friends|multiplayer/.test(text)) {
    reasonBadge = 'Favorit Mabar Co-op';
    reasonBadgeEn = 'Co-op Squad Favorite';
    badgeIcon = 'Users';
  } else if (style === 'solo' && /story|campaign|dungeon/.test(text)) {
    reasonBadge = 'Petualangan Solo';
    reasonBadgeEn = 'Solo Campaign';
    badgeIcon = 'Award';
  } else if (players >= 20000) {
    reasonBadge = `${Math.round(players / 1000)}K Pemain Aktif`;
    reasonBadgeEn = `${Math.round(players / 1000)}K Active Players`;
    badgeIcon = 'Flame';
  } else if (upPct >= 0.88 && totalVotes > 50) {
    reasonBadge = `${Math.round(upPct * 100)}% Rating Positif`;
    reasonBadgeEn = `${Math.round(upPct * 100)}% Positive`;
    badgeIcon = 'Star';
  } else if (strategy === 'hidden-gem' || (players > 0 && players < 5000)) {
    reasonBadge = 'Hidden Gem Berkualitas';
    reasonBadgeEn = 'Quality Hidden Gem';
    badgeIcon = 'Gem';
  } else if (rating >= 4.5) {
    reasonBadge = `Rating ${rating.toFixed(1)} Tinggi`;
    reasonBadgeEn = `Top Rated (${rating.toFixed(1)})`;
    badgeIcon = 'Star';
  }

  return { score, reasonBadge, reasonBadgeEn, badgeIcon };
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