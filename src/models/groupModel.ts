import mongoose from "mongoose";

// GP Categories
export const GP_CATEGORIES = ["Vibe GP", "Movie GP", "Anime GP", "Other GP"] as const;
export type GPCategory = typeof GP_CATEGORIES[number];

// Sub-types for each category
export const VIBE_GP_SUBTYPES = ["Fun", "Chill", "Overthinker", "Chaos", "Calm", "Random Talk"] as const;
export const MOVIE_GP_SUBTYPES = ["Movie Name", "Genre"] as const;
export const ANIME_GP_SUBTYPES = ["Anime Name", "Genre"] as const;
export const OTHER_GP_SUBTYPES = ["Standup", "Travel", "Trip", "Tech Talk", "Music", "Sports"] as const;

// Movie/Anime Genres
export const MOVIE_GENRES = ["Horror", "Action", "Sci-Fi", "Comedy", "Drama", "Romance", "Thriller", "Fantasy"] as const;
export const ANIME_GENRES = ["Shounen", "Romance", "Isekai", "Slice of Life", "Action", "Comedy", "Drama", "Fantasy"] as const;

// Talk Topics
export const TALK_TOPICS = [
  "Life stuff",
  "Overthinking & mental vibe",
  "Random fun & nonsense",
  "Movie / Anime discussion",
  "Fan theories",
  "Day experiences",
  "Trip planning",
  "Roast sessions",
  "Meme talk",
  "Relationship stuff",
  "Career / ambitions",
] as const;

// Reasons for creating GP
export const CREATION_REASONS = [
  "Feeling bored",
  "Feeling lonely today",
  "Want to meet new people",
  "Need people with same movie/anime interest",
  "Want people with same vibe",
  "Just for fun",
  "Planning something",
  "Want deep discussions",
  "Want a safe chill space",
] as const;

// Permanent conversion voting schema
const permanentVoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vote: {
    type: String,
    enum: ["yes", "no"],
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// GP Schema
const groupSchema = new mongoose.Schema(
  {
    // Basic Info
    category: {
      type: String,
      enum: GP_CATEGORIES,
      required: true,
    },
    subType: {
      type: String,
      required: true,
      trim: true,
    },
    // For Movie/Anime GPs, store the name if provided
    specificName: {
      type: String,
      trim: true,
      default: "",
    },
    // For Movie/Anime genre-based GPs
    genre: {
      type: String,
      trim: true,
      default: "",
    },

    // What We'll Talk About
    talkTopics: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0 && v.length <= 3;
        },
        message: "Must select 1-3 talk topics",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    // Reason for Creation
    creationReason: {
      type: String,
      enum: CREATION_REASONS,
      required: true,
    },
    reasonNote: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // Location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        index: "2dsphere",
      },
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    zone: {
      type: String,
      trim: true,
      default: "",
    },

    // Members
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxMembers: {
      type: Number,
      default: 5,
      min: 2,
      max: 5,
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status & Timing
    status: {
      type: String,
      enum: ["active", "expired", "converted", "failed"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    firstMessageAt: {
      type: Date,
      default: null,
    },

    // Permanent Conversion
    isPermanentConversionEligible: {
      type: Boolean,
      default: false,
    },
    permanentConversionVotes: [permanentVoteSchema],
    permanentConversionRequestedAt: {
      type: Date,
      default: null,
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    convertedToChatAt: {
      type: Date,
      default: null,
    },
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Engagement tracking
    messageCount: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    toxicityFlags: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
groupSchema.index({ "location.coordinates": "2dsphere" });
groupSchema.index({ status: 1, expiresAt: 1 });
groupSchema.index({ createdBy: 1, category: 1, status: 1 });
groupSchema.index({ category: 1, subType: 1, status: 1 });

// Method to check if GP is active
groupSchema.methods.isActive = function () {
  return (
    this.status === "active" &&
    this.expiresAt > new Date() &&
    !this.isPermanent
  );
};

// Method to check if GP is eligible for permanent conversion
groupSchema.methods.checkPermanentEligibility = function () {
  const now = new Date();
  const hoursActive = (now.getTime() - this.startedAt.getTime()) / (1000 * 60 * 60);
  
  return (
    this.members.length >= 3 &&
    hoursActive >= 2.5 &&
    this.toxicityFlags === 0 &&
    this.status === "active" &&
    !this.isPermanent &&
    !this.isPermanentConversionEligible
  );
};

// Method to calculate permanent conversion vote result
groupSchema.methods.getPermanentConversionResult = function () {
  if (this.permanentConversionVotes.length === 0) return null;
  
  const yesVotes = this.permanentConversionVotes.filter((v: any) => v.vote === "yes").length;
  const totalVotes = this.permanentConversionVotes.length;
  const percentage = (yesVotes / totalVotes) * 100;
  
  return {
    yesVotes,
    totalVotes,
    percentage,
    approved: percentage >= 70,
  };
};

const Group = mongoose.models.Group || mongoose.model("Group", groupSchema);
export default Group;
