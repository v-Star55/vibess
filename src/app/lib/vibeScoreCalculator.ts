/**
 * Vibe Score Calculator
 * Calculates vibe score vector from emoji, description, and song data
 */

import { getEmotionCategory, extractIntent } from "./vibeMatching";

export interface VibeInput {
  emoji: string;
  description: string;
  energyLevel: number; // 1-10
  currentIntent: string[]; // 1-2 intents
  contextTag?: string;
}

export interface VibeScoreVector {
  mood: string;
  energy: number;
  positivity: number;
  genre: string;
  intent: string;
}

/**
 * Calculate positivity from description and emoji
 */
function calculatePositivity(description: string, emoji: string): number {
  const positiveWords = [
    "happy", "great", "amazing", "wonderful", "blessed", "grateful", "joy",
    "excited", "pumped", "fire", "lit", "love", "beautiful", "perfect",
    "fantastic", "awesome", "incredible", "best", "good", "nice", "sweet"
  ];
  
  const negativeWords = [
    "sad", "down", "blue", "lonely", "hurt", "broken", "tired", "exhausted",
    "stressed", "anxious", "worried", "scared", "angry", "frustrated", "bad",
    "terrible", "awful", "horrible", "worst", "hate", "disappointed"
  ];

  const words = description.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.some((pw) => word.includes(pw))) positiveCount++;
    if (negativeWords.some((nw) => word.includes(nw))) negativeCount++;
  });

  // Emoji positivity mapping
  const emojiPositivity: Record<string, number> = {
    "😊": 85, "😄": 90, "😃": 90, "😁": 95, "😆": 95, "🥳": 100,
    "😎": 80, "🤩": 95, "😢": 15, "😭": 10, "😔": 25, "😞": 20,
    "😟": 30, "😕": 35, "🙁": 30, "☹️": 25, "😌": 70, "😴": 50,
    "😑": 50, "😐": 50, "🙂": 75, "🧘": 65, "🌊": 60, "🔥": 85,
    "💯": 90, "⚡": 85, "🚀": 90, "💪": 80, "🎉": 95, "✨": 85,
    "🌟": 85, "🎨": 70, "🎭": 70, "🎪": 80, "🎬": 75, "📝": 65,
    "✍️": 70, "💡": 75, "🧠": 70, "👥": 75, "🤝": 80, "💬": 70,
    "🎤": 80, "🎵": 75, "🎶": 75, "🎧": 70, "📱": 60, "💔": 20,
    "🌙": 40, "❤️": 90, "💕": 95, "💖": 95, "💗": 90, "💓": 90,
    "😍": 95, "🥰": 100, "😘": 90, "😠": 20, "😡": 15, "🤬": 10,
    "💢": 20, "😤": 30, "😾": 25, "👿": 15, "😰": 35, "😨": 30,
    "😱": 25, "😓": 40, "😥": 35, "😖": 30, "😣": 35,
  };

  const emojiScore = emojiPositivity[emoji] || 50;
  
  // Calculate base score from words
  const wordScore = positiveCount > negativeCount
    ? 50 + Math.min(50, (positiveCount - negativeCount) * 10)
    : 50 - Math.min(50, (negativeCount - positiveCount) * 10);

  // Blend emoji and word scores (60% emoji, 40% words)
  return Math.round(emojiScore * 0.6 + wordScore * 0.4);
}

/**
 * Calculate energy from energyLevel (1-10) and emoji
 * Converts 1-10 scale to 0-100 scale
 */
function calculateEnergy(energyLevel: number, emoji: string): number {
  // Convert 1-10 scale to 0-100 scale
  // 1 = 10, 5 = 50, 10 = 100
  let baseEnergy = (energyLevel - 1) * (100 / 9); // Maps 1->0, 10->100

  // Emoji energy adjustment (smaller adjustments since we have direct user input)
  const emojiEnergy: Record<string, number> = {
    "🔥": 5, "💯": 3, "⚡": 8, "🚀": 5, "💪": 3, "🎉": 5,
    "✨": 2, "🌟": 2, "😆": 3, "😄": 2, "😃": 2, "😁": 3,
    "🥳": 5, "😎": 1, "🤩": 3, "😴": -8, "😌": -3, "🧘": -5,
    "😢": -3, "😭": -5, "😔": -5, "😞": -5, "😟": -3,
  };

  const emojiAdjustment = emojiEnergy[emoji] || 0;
  
  return Math.max(0, Math.min(100, baseEnergy + emojiAdjustment));
}

/**
 * Main function to calculate vibe score vector
 */
export function calculateVibeScore(input: VibeInput): VibeScoreVector {
  const mood = getEmotionCategory(input.emoji);
  // Use the first intent from currentIntent array, or extract from description as fallback
  const intent = input.currentIntent && input.currentIntent.length > 0 
    ? input.currentIntent[0].toLowerCase().replace(/\s+/g, '_')
    : extractIntent(input.description);
  const energy = calculateEnergy(input.energyLevel, input.emoji);
  const positivity = calculatePositivity(input.description, input.emoji);
  // Genre is no longer used, but we keep it for backward compatibility
  // Use a default or derive from context if needed
  const genre = "general"; // Default since we removed song/genre

  return {
    mood,
    energy,
    positivity,
    genre,
    intent,
  };
}

