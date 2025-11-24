import mongoose from "mongoose";

// Vibe Score Vector Schema
const vibeScoreVectorSchema = new mongoose.Schema(
  {
    mood: {
      type: String,
      required: true,
    },
    energy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    positivity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    genre: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Theme Schema
const themeSchema = new mongoose.Schema(
  {
    primaryColor: {
      type: String,
      required: true,
    },
    secondaryColor: {
      type: String,
      required: true,
    },
    accentColor: {
      type: String,
      required: true,
    },
    gradientFrom: {
      type: String,
      required: true,
    },
    gradientTo: {
      type: String,
      required: true,
    },
    borderGlow: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Intent options
const INTENT_OPTIONS = [
  "Chill conversation",
  "Make a friend",
  "Share thoughts",
  "Rant / vent",
  "Get motivated",
  "Need advice",
  "Want to laugh",
  "No talking, just vibe",
];

// Interaction boundary options
const INTERACTION_BOUNDARY_OPTIONS = [
  "Fast replies",
  "Slow replies",
  "Short messages only",
  "Voice notes okay",
  "Deep conversations",
  "Light and fun only",
];

// Feeling options
export const FEELING_OPTIONS = [
  "Let's laugh",
  "Talk nonsense",
  "Brain dump",
  "Share thoughts",
  "Deep talk maybe",
  "Annoy me playfully",
  "Just existing",
  "Feeling goofy",
  "Meme-only mode",
  "Soft and quiet",
  "Cozy vibes only",
  "Low battery mood",
  "Here but not here",
  "Social but awkward",
  "Ready for chaos",
  "Slow and gentle",
  "Need a little comfort",
  "Curious about your life",
  "Friendly but introverted",
  "Creative spark mode",
];

// Vibe availability options
export const VIBE_AVAILABILITY_OPTIONS = [
  "Down to vibe",
  "Chill mode",
  "Hyper mood",
  "Only light talk",
  "Busy but around",
];

// Personality prompt options
export const PERSONALITY_PROMPT_OPTIONS = [
  "a sleepy panda",
  "a cozy cat",
  "a chaotic squirrel",
  "a confused potato",
  "a dramatic peacock",
  "a low-battery robot",
  "a phone stuck at 1%",
  "a browser with 50 tabs open",
  "a glitching NPC",
  "a warm cinnamon roll",
  "a tiny hedgehog hiding in a blanket",
  "a floating cloud",
  "a wandering jellyfish",
  "a lone firefly looking for light (lonely)",
  "a puzzle piece that doesn't fit today (emotionally off)",
];

// Main Vibe Card Schema
const vibeCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          const words = v.trim().split(/\s+/).filter((w) => w.length > 0);
          return words.length >= 2 && words.length <= 8;
        },
        message: "Description must be 2-8 words",
      },
    },
    energyLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    currentIntent: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length >= 1 && v.length <= 2;
        },
        message: "Must select 1-2 intents",
      },
    },
    contextTag: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },
    interactionBoundary: {
      type: String,
      required: true,
      enum: INTERACTION_BOUNDARY_OPTIONS,
    },
    feelingOptions: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every((option) => FEELING_OPTIONS.includes(option));
        },
        message: "All feeling options must be from the predefined list",
      },
    },
    vibeAvailability: {
      type: String,
      default: "",
      trim: true,
      enum: [...VIBE_AVAILABILITY_OPTIONS, ""],
    },
    personalityPrompt: {
      type: String,
      default: "",
      trim: true,
      enum: [...PERSONALITY_PROMPT_OPTIONS, ""],
    },
    theme: {
      type: themeSchema,
      required: true,
    },
    vibeScore: {
      type: vibeScoreVectorSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
vibeCardSchema.index({ user: 1, isActive: 1 });
vibeCardSchema.index({ "location.coordinates": "2dsphere" });
vibeCardSchema.index({ "vibeScore.mood": 1, "vibeScore.energy": 1 });
vibeCardSchema.index({ energyLevel: 1, currentIntent: 1, interactionBoundary: 1 });

// Delete cached model if it exists to ensure fresh schema
if (mongoose.models.VibeCard) {
  delete mongoose.models.VibeCard;
}

const VibeCard = mongoose.model("VibeCard", vibeCardSchema);
export default VibeCard;
