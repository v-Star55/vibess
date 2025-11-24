/**
 * Dynamic Theme Generator
 * Generates color themes based on song genre, BPM/energy, and mood emoji
 */

// Genre color palettes
const GENRE_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  pop: { primary: "#FF6B9D", secondary: "#C44569", accent: "#FFB6C1" },
  rock: { primary: "#FF4757", secondary: "#C44536", accent: "#FF6348" },
  hiphop: { primary: "#5F27CD", secondary: "#341F97", accent: "#A55EEA" },
  rap: { primary: "#5F27CD", secondary: "#341F97", accent: "#A55EEA" },
  electronic: { primary: "#00D2D3", secondary: "#00A8A9", accent: "#54E0E1" },
  edm: { primary: "#00D2D3", secondary: "#00A8A9", accent: "#54E0E1" },
  jazz: { primary: "#FFA502", secondary: "#D68910", accent: "#FFC048" },
  blues: { primary: "#3742FA", secondary: "#2F3542", accent: "#5F6FFF" },
  country: { primary: "#FFA502", secondary: "#D68910", accent: "#FFC048" },
  classical: { primary: "#747D8C", secondary: "#57606F", accent: "#A4B0BE" },
  indie: { primary: "#FF6348", secondary: "#C44536", accent: "#FF7675" },
  alternative: { primary: "#FF6348", secondary: "#C44536", accent: "#FF7675" },
  rnb: { primary: "#5F27CD", secondary: "#341F97", accent: "#A55EEA" },
  default: { primary: "#6C5CE7", secondary: "#4834D4", accent: "#A29BFE" },
};

// Emoji color psychology mapping
const EMOJI_COLORS: Record<string, string> = {
  "😊": "#FFD700", // happy - gold
  "😄": "#FF6B6B", // very happy - coral
  "😃": "#4ECDC4", // excited - teal
  "😁": "#FFE66D", // grinning - yellow
  "😆": "#FF6B9D", // laughing - pink
  "🥳": "#FFA502", // party - orange
  "😎": "#00D2D3", // cool - cyan
  "🤩": "#FFD700", // star-struck - gold
  "😢": "#5F27CD", // crying - purple
  "😭": "#3742FA", // sobbing - blue
  "😔": "#747D8C", // sad - gray
  "😞": "#57606F", // disappointed - dark gray
  "😟": "#2F3542", // worried - darker gray
  "😕": "#747D8C", // confused - gray
  "🙁": "#57606F", // slightly sad - dark gray
  "☹️": "#2F3542", // frowning - darker gray
  "😌": "#A4B0BE", // relieved - light gray
  "😴": "#2F3542", // sleeping - dark
  "😑": "#747D8C", // expressionless - gray
  "😐": "#A4B0BE", // neutral - light gray
  "🙂": "#FFD700", // slightly happy - gold
  "🧘": "#4ECDC4", // meditating - teal
  "🌊": "#00D2D3", // wave - cyan
  "🔥": "#FF4757", // fire - red
  "💯": "#FF6348", // 100 - orange-red
  "⚡": "#FFD700", // lightning - gold
  "🚀": "#FF6B9D", // rocket - pink
  "💪": "#FF4757", // muscle - red
  "🎉": "#FFA502", // party - orange
  "✨": "#FFD700", // sparkles - gold
  "🌟": "#FFD700", // star - gold
  "🎨": "#5F27CD", // artist - purple
  "🎭": "#FF6B9D", // theater - pink
  "🎪": "#FFA502", // circus - orange
  "🎬": "#3742FA", // movie - blue
  "📝": "#4ECDC4", // memo - teal
  "✍️": "#FF6348", // writing - orange-red
  "💡": "#FFD700", // lightbulb - gold
  "🧠": "#5F27CD", // brain - purple
  "👥": "#4ECDC4", // people - teal
  "🤝": "#00D2D3", // handshake - cyan
  "💬": "#6C5CE7", // speech - purple
  "🎤": "#FF6B9D", // mic - pink
  "🎵": "#5F27CD", // note - purple
  "🎶": "#5F27CD", // notes - purple
  "🎧": "#3742FA", // headphones - blue
  "📱": "#00D2D3", // phone - cyan
  "💔": "#FF4757", // broken heart - red
  "🌙": "#5F27CD", // moon - purple
  "❤️": "#FF4757", // heart - red
  "💕": "#FF6B9D", // hearts - pink
  "💖": "#FF6B9D", // sparkling heart - pink
  "💗": "#FF6B9D", // growing heart - pink
  "💓": "#FF4757", // beating heart - red
  "😍": "#FF6B9D", // heart eyes - pink
  "🥰": "#FF6B9D", // smiling with hearts - pink
  "😘": "#FF6B9D", // kissing - pink
  "😠": "#FF4757", // angry - red
  "😡": "#FF6348", // pouting - orange-red
  "🤬": "#FF4757", // swearing - red
  "💢": "#FF6348", // anger - orange-red
  "😤": "#FF6B6B", // huffing - coral
  "😾": "#2F3542", // pouting cat - dark
  "👿": "#5F27CD", // devil - purple
  "😰": "#5F27CD", // anxious - purple
  "😨": "#3742FA", // fearful - blue
  "😱": "#5F27CD", // screaming - purple
  "😓": "#00D2D3", // cold sweat - cyan
  "😥": "#4ECDC4", // sad relief - teal
  "😖": "#5F27CD", // confounded - purple
  "😣": "#747D8C", // persevering - gray
};

// Energy level adjustments
function adjustForEnergy(baseColor: string, energy: number): string {
  // Convert hex to RGB
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Higher energy = brighter, more saturated
  // Lower energy = darker, less saturated
  const energyFactor = energy / 100;
  const brightness = 0.5 + energyFactor * 0.5; // 0.5 to 1.0
  const saturation = 0.6 + energyFactor * 0.4; // 0.6 to 1.0

  // Adjust RGB
  const newR = Math.min(255, Math.round(r * brightness * saturation + (1 - saturation) * 128));
  const newG = Math.min(255, Math.round(g * brightness * saturation + (1 - saturation) * 128));
  const newB = Math.min(255, Math.round(b * brightness * saturation + (1 - saturation) * 128));

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

// Generate gradient colors
function generateGradient(baseColor: string, energy: number): { from: string; to: string } {
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darker version for gradient end
  const darkenFactor = 0.3;
  const darkR = Math.max(0, Math.round(r * darkenFactor));
  const darkG = Math.max(0, Math.round(g * darkenFactor));
  const darkB = Math.max(0, Math.round(b * darkenFactor));

  const from = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const to = `#${darkR.toString(16).padStart(2, "0")}${darkG.toString(16).padStart(2, "0")}${darkB.toString(16).padStart(2, "0")}`;

  return { from, to };
}

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderGlow: string;
}

export function generateTheme(
  genre: string,
  energy: number,
  emoji: string
): Theme {
  // Get base colors from genre
  const genreColors = GENRE_COLORS[genre.toLowerCase()] || GENRE_COLORS.default;
  
  // Get emoji color influence
  const emojiColor = EMOJI_COLORS[emoji] || genreColors.primary;
  
  // Blend genre and emoji colors (70% genre, 30% emoji)
  const blendColor = (color1: string, color2: string, ratio: number) => {
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 * ratio + r2 * (1 - ratio));
    const g = Math.round(g1 * ratio + g2 * (1 - ratio));
    const b = Math.round(b1 * ratio + b2 * (1 - ratio));
    
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const primaryColor = blendColor(genreColors.primary, emojiColor, 0.7);
  const secondaryColor = blendColor(genreColors.secondary, emojiColor, 0.7);
  const accentColor = blendColor(genreColors.accent, emojiColor, 0.7);

  // Adjust for energy
  const adjustedPrimary = adjustForEnergy(primaryColor, energy);
  const adjustedAccent = adjustForEnergy(accentColor, energy);

  // Generate gradient
  const gradient = generateGradient(adjustedPrimary, energy);

  return {
    primaryColor: adjustedPrimary,
    secondaryColor: secondaryColor,
    accentColor: adjustedAccent,
    gradientFrom: gradient.from,
    gradientTo: gradient.to,
    borderGlow: adjustedAccent,
  };
}

