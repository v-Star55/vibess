import mongoose from "mongoose";

// Chat Room Message Schema
const chatRoomMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Chat Room Schema - Groups of 4 people based on vibe matching
const chatRoomSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [chatRoomMessageSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    // Vibe diversity metrics (for matching algorithm)
    vibeDiversity: {
      lowEnergy: Number, // Count of participants with energy 1-3
      midEnergy: Number, // Count of participants with energy 4-7
      highEnergy: Number, // Count of participants with energy 8-10
    },
    // Average vibe similarity score for the group
    averageSimilarity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure exactly 4 participants (validation handled in pre-save hook)
chatRoomSchema.pre("save", function (next) {
  if (this.participants && this.participants.length !== 4) {
    next(new Error("Chat room must have exactly 4 participants"));
    return;
  }
  next();
});

// Indexes
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ expiresAt: 1 });
chatRoomSchema.index({ isExpired: 1 });
chatRoomSchema.index({ createdAt: -1 });

// Method to check if room is expired
chatRoomSchema.methods.checkExpiration = function () {
  if (new Date() > this.expiresAt) {
    this.isExpired = true;
    return true;
  }
  return false;
};

// Method to check if user is a participant
chatRoomSchema.methods.isParticipant = function (userId: string) {
  return this.participants.some(
    (p: any) => p.toString() === userId.toString()
  );
};

const ChatRoom =
  mongoose.models.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);
export default ChatRoom;

