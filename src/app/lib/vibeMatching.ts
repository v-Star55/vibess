/**
 * Vibe Matching Algorithm
 * Calculates similarity score between two vibe cards
 * Returns a score from 0-100, where 70+ is considered a match
 */

export interface VibeScoreVector {
  mood: string;
  energy: number; // 0-100
  positivity: number; // 0-100
  genre: string;
  intent: string;
}

export interface MatchResult {
  similarity: number; // 0-100
  category: "Mood Twins" | "Near Your Energy" | "Similar Vibes" | null;
  breakdown: {
    mood: number;
    energy: number;
    positivity: number;
    intent: number;
    energyLevel: number;
    boundary: number;
    contextBonus: number;
  };
}

// Emotional categories mapping
const EMOTION_CATEGORIES: Record<string, string[]> = {
  happy: ["😊", "😄", "😃", "😁", "😆", "🥳", "😎", "🤩"],
  sad: ["😢", "😭", "😔", "😞", "😟", "😕", "🙁", "☹️"],
  chill: ["😌", "😴", "😑", "😐", "🙂", "😊", "🧘", "🌊"],
  hype: ["🔥", "💯", "⚡", "🚀", "💪", "🎉", "✨", "🌟"],
  creative: ["🎨", "🎭", "🎪", "🎬", "📝", "✍️", "💡", "🧠"],
  social: ["👥", "🤝", "💬", "🎤", "🎵", "🎶", "🎧", "📱"],
  lonely: ["😔", "😞", "😟", "😕", "🙁", "😢", "💔", "🌙"],
  love: ["❤️", "💕", "💖", "💗", "💓", "😍", "🥰", "😘"],
  angry: ["😠", "😡", "🤬", "💢", "😤", "😾", "👿", "🔥"],
  anxious: ["😰", "😨", "😱", "😓", "😥", "😟", "😖", "😣"],
};

// Intent keywords mapping
const INTENT_KEYWORDS: Record<string, string[]> = {
  chill: ["chill", "relax", "calm", "peaceful", "zen", "mellow", "quiet"],
  social: ["social", "party", "friends", "together", "hang", "meet", "connect"],
  sad: ["sad", "down", "blue", "melancholy", "lonely", "missing", "hurt"],
  hype: ["hype", "excited", "pumped", "energetic", "fire", "lit", "amazing"],
  creative: ["creative", "inspired", "artistic", "making", "building", "creating"],
  lonely: ["lonely", "alone", "isolated", "missing", "empty", "void"],
  happy: ["happy", "joy", "great", "wonderful", "amazing", "blessed", "grateful"],
};

/**
 * Get emotional category from emoji
 */
export function getEmotionCategory(emoji: string): string {
  for (const [category, emojis] of Object.entries(EMOTION_CATEGORIES)) {
    if (emojis.includes(emoji)) {
      return category;
    }
  }
  return "neutral";
}

/**
 * Extract intent from description words
 */
export function extractIntent(description: string): string {
  const words = description.toLowerCase().split(/\s+/);
  let maxMatches = 0;
  let detectedIntent = "neutral";

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches = keywords.filter((keyword) =>
      words.some((word) => word.includes(keyword))
    ).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIntent = intent;
    }
  }

  return detectedIntent;
}

/**
 * Calculate mood similarity (0-100)
 */
function calculateMoodSimilarity(mood1: string, mood2: string): number {
  if (mood1 === mood2) return 100;
  
  // Related moods get partial score
  const relatedMoods: Record<string, string[]> = {
    happy: ["hype", "social", "love"],
    sad: ["lonely", "anxious"],
    chill: ["happy", "creative"],
    hype: ["happy", "social"],
    creative: ["chill", "happy"],
    social: ["happy", "hype"],
    lonely: ["sad", "anxious"],
    love: ["happy", "social"],
  };

  if (relatedMoods[mood1]?.includes(mood2) || relatedMoods[mood2]?.includes(mood1)) {
    return 60;
  }

  return 20; // Very different moods
}

/**
 * Calculate energy similarity (0-100)
 */
function calculateEnergySimilarity(energy1: number, energy2: number): number {
  const diff = Math.abs(energy1 - energy2);
  if (diff === 0) return 100;
  if (diff <= 10) return 90;
  if (diff <= 20) return 75;
  if (diff <= 30) return 60;
  if (diff <= 40) return 45;
  if (diff <= 50) return 30;
  return 15;
}

/**
 * Calculate positivity similarity (0-100)
 */
function calculatePositivitySimilarity(pos1: number, pos2: number): number {
  const diff = Math.abs(pos1 - pos2);
  if (diff === 0) return 100;
  if (diff <= 10) return 85;
  if (diff <= 20) return 70;
  if (diff <= 30) return 55;
  if (diff <= 40) return 40;
  return 25;
}

/**
 * Calculate genre similarity (0-100)
 */
function calculateGenreSimilarity(genre1: string, genre2: string): number {
  if (genre1.toLowerCase() === genre2.toLowerCase()) return 100;

  // Related genres
  const genreGroups: Record<string, string[]> = {
    pop: ["pop", "dance", "electronic", "edm"],
    rock: ["rock", "alternative", "indie", "punk"],
    hiphop: ["hip-hop", "rap", "trap", "r&b"],
    electronic: ["electronic", "edm", "house", "techno", "dubstep"],
    jazz: ["jazz", "blues", "soul", "funk"],
    country: ["country", "folk", "bluegrass"],
    classical: ["classical", "orchestral", "instrumental"],
  };

  for (const [group, genres] of Object.entries(genreGroups)) {
    if (
      genres.some((g) => g === genre1.toLowerCase()) &&
      genres.some((g) => g === genre2.toLowerCase())
    ) {
      return 70;
    }
  }

  return 30;
}

/**
 * Calculate intent similarity (0-100)
 * Now handles array of intents
 */
function calculateIntentSimilarity(intent1: string | string[], intent2: string | string[]): number {
  // Normalize to arrays
  const intents1 = Array.isArray(intent1) ? intent1 : [intent1];
  const intents2 = Array.isArray(intent2) ? intent2 : [intent2];
  
  // Normalize intent strings (remove spaces and special chars, lowercase)
  // Replace spaces, slashes, commas with underscores, then clean up multiple underscores
  const normalize = (s: string): string => {
    return s
      .toLowerCase()
      .replace(/[\s\/,]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };
  
  const normalized1 = intents1.map(normalize);
  const normalized2 = intents2.map(normalize);
  
  // Check for exact matches
  const exactMatches = normalized1.filter(i => normalized2.includes(i));
  if (exactMatches.length > 0) {
    // If both have 2 intents and both match, perfect score
    if (normalized1.length === 2 && normalized2.length === 2 && exactMatches.length === 2) {
      return 100;
    }
    // If at least one matches, high score
    return 85;
  }
  
  // Related intents mapping using Map to avoid object literal parsing issues
  const relatedIntentsMap = new Map<string, string[]>();
  relatedIntentsMap.set('chill_conversation', ['make_a_friend', 'share_thoughts']);
  relatedIntentsMap.set('make_a_friend', ['chill_conversation', 'share_thoughts', 'want_to_laugh']);
  relatedIntentsMap.set('share_thoughts', ['chill_conversation', 'make_a_friend', 'need_advice']);
  relatedIntentsMap.set('rant_vent', ['need_advice', 'share_thoughts']);
  relatedIntentsMap.set('get_motivated', ['need_advice', 'want_to_laugh']);
  relatedIntentsMap.set('need_advice', ['share_thoughts', 'rant_vent']);
  relatedIntentsMap.set('want_to_laugh', ['make_a_friend', 'get_motivated']);
  relatedIntentsMap.set('no_talking_just_vibe', ['chill_conversation']);
  
  // Check for related intents
  for (const i1 of normalized1) {
    for (const i2 of normalized2) {
      const related1 = relatedIntentsMap.get(i1);
      const related2 = relatedIntentsMap.get(i2);
      
      if (related1 && related1.includes(i2)) {
        return 65;
      }
      if (related2 && related2.includes(i1)) {
        return 65;
      }
    }
  }

  return 25;
}

/**
 * Calculate energy level similarity (0-100)
 * Direct comparison of 1-10 scale
 */
function calculateEnergyLevelSimilarity(level1: number, level2: number): number {
  const diff = Math.abs(level1 - level2);
  if (diff === 0) return 100;
  if (diff <= 1) return 90;
  if (diff <= 2) return 75;
  if (diff <= 3) return 60;
  if (diff <= 4) return 45;
  if (diff <= 5) return 30;
  return 15;
}

/**
 * Calculate interaction boundary compatibility (0-100)
 */
function calculateBoundaryCompatibility(boundary1: string, boundary2: string): number {
  if (boundary1 === boundary2) return 100;
  
  // Compatible pairs
  const compatiblePairs: Record<string, string[]> = {
    "Fast replies": ["Fast replies", "Short messages only"],
    "Slow replies": ["Slow replies", "Deep conversations"],
    "Short messages only": ["Short messages only", "Fast replies", "Light and fun only"],
    "Voice notes okay": ["Voice notes okay", "Deep conversations"],
    "Deep conversations": ["Deep conversations", "Slow replies", "Voice notes okay"],
    "Light and fun only": ["Light and fun only", "Short messages only", "Fast replies"],
  };
  
  const normalized1 = boundary1.toLowerCase();
  const normalized2 = boundary2.toLowerCase();
  
  // Check if boundaries are compatible
  for (const [key, values] of Object.entries(compatiblePairs)) {
    if (key.toLowerCase() === normalized1) {
      if (values.some(v => v.toLowerCase() === normalized2)) {
        return 80;
      }
    }
  }
  
  // Some boundaries are incompatible
  const incompatiblePairs: [string, string][] = [
    ["Fast replies", "Slow replies"],
    ["Deep conversations", "Short messages only"],
    ["Light and fun only", "Deep conversations"],
  ];
  
  for (const [a, b] of incompatiblePairs) {
    if ((a.toLowerCase() === normalized1 && b.toLowerCase() === normalized2) ||
        (b.toLowerCase() === normalized1 && a.toLowerCase() === normalized2)) {
      return 30;
    }
  }
  
  return 60; // Neutral compatibility
}

/**
 * Calculate context tag similarity bonus (0-20 bonus points)
 */
function calculateContextTagBonus(tag1: string | undefined, tag2: string | undefined): number {
  if (!tag1 || !tag2) return 0;
  if (tag1.toLowerCase() === tag2.toLowerCase()) return 20;
  return 0;
}

/**
 * Extended vibe data interface for matching
 */
export interface VibeCardData {
  vibeScore: VibeScoreVector;
  energyLevel: number;
  currentIntent: string[];
  contextTag?: string;
  interactionBoundary: string;
}

/**
 * Main matching function
 * Now accepts full vibe card data including new fields
 */
export function calculateVibeSimilarity(
  vibe1: VibeCardData | VibeScoreVector,
  vibe2: VibeCardData | VibeScoreVector
): MatchResult {
  // Extract vibe scores (backward compatible)
  const score1 = 'vibeScore' in vibe1 ? vibe1.vibeScore : vibe1;
  const score2 = 'vibeScore' in vibe2 ? vibe2.vibeScore : vibe2;
  
  // Extract new fields if available
  const energyLevel1 = 'energyLevel' in vibe1 ? vibe1.energyLevel : undefined;
  const energyLevel2 = 'energyLevel' in vibe2 ? vibe2.energyLevel : undefined;
  const intent1 = 'currentIntent' in vibe1 ? vibe1.currentIntent : score1.intent;
  const intent2 = 'currentIntent' in vibe2 ? vibe2.currentIntent : score2.intent;
  const contextTag1 = 'contextTag' in vibe1 ? vibe1.contextTag : undefined;
  const contextTag2 = 'contextTag' in vibe2 ? vibe2.contextTag : undefined;
  const boundary1 = 'interactionBoundary' in vibe1 ? vibe1.interactionBoundary : undefined;
  const boundary2 = 'interactionBoundary' in vibe2 ? vibe2.interactionBoundary : undefined;

  const moodSim = calculateMoodSimilarity(score1.mood, score2.mood);
  const energySim = calculateEnergySimilarity(score1.energy, score2.energy);
  const positivitySim = calculatePositivitySimilarity(score1.positivity, score2.positivity);
  const intentSim = calculateIntentSimilarity(intent1, intent2);
  
  // New field calculations
  const energyLevelSim = (energyLevel1 !== undefined && energyLevel2 !== undefined)
    ? calculateEnergyLevelSimilarity(energyLevel1, energyLevel2)
    : energySim; // Fallback to energy similarity if not available
  
  const boundarySim = (boundary1 && boundary2)
    ? calculateBoundaryCompatibility(boundary1, boundary2)
    : 70; // Default neutral if not available
  
  const contextBonus = calculateContextTagBonus(contextTag1, contextTag2);

  // Weighted average (updated weights)
  const weights = {
    mood: 0.20,
    energy: 0.15,
    positivity: 0.15,
    intent: 0.20,
    energyLevel: 0.15,
    boundary: 0.10,
  };

  let similarity =
    moodSim * weights.mood +
    energySim * weights.energy +
    positivitySim * weights.positivity +
    intentSim * weights.intent +
    energyLevelSim * weights.energyLevel +
    boundarySim * weights.boundary;

  // Add context bonus (up to 20 points)
  similarity = Math.min(100, similarity + contextBonus);

  // Determine category
  let category: "Mood Twins" | "Near Your Energy" | "Similar Vibes" | null = null;
  
  if (similarity >= 85 && moodSim >= 90) {
    category = "Mood Twins";
  } else if (energyLevelSim >= 80 && energyLevel1 !== undefined && energyLevel2 !== undefined && Math.abs(energyLevel1 - energyLevel2) <= 2) {
    category = "Near Your Energy";
  } else if (similarity >= 70) {
    category = "Similar Vibes";
  }

  return {
    similarity: Math.round(similarity),
    category,
    breakdown: {
      mood: Math.round(moodSim),
      energy: Math.round(energySim),
      positivity: Math.round(positivitySim),
      intent: Math.round(intentSim),
      energyLevel: Math.round(energyLevelSim),
      boundary: Math.round(boundarySim),
      contextBonus: Math.round(contextBonus),
    },
  };
}

