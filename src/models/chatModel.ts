import mongoose from "mongoose";

// Message Schema
const messageSchema = new mongoose.Schema(
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
    isIcebreaker: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Chat Schema
const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isPermanentlyUnlocked: {
      type: Boolean,
      default: false,
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    firstMessageAt: {
      type: Date,
      default: null,
    },
    // Safety features
    reportedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ expiresAt: 1 });
chatSchema.index({ isLocked: 1, isPermanentlyUnlocked: 1 });

// Method to check if chat is expired
chatSchema.methods.checkExpiration = function () {
  if (this.isPermanentlyUnlocked) return false;
  if (new Date() > this.expiresAt) {
    this.isLocked = true;
    return true;
  }
  return false;
};

// Method to unlock permanently if both users follow each other
chatSchema.methods.checkPermanentUnlock = async function () {
  if (this.isPermanentlyUnlocked) return true;
  
  const User = mongoose.model("User");
  const [user1, user2] = this.participants;
  
  const user1Doc = await User.findById(user1);
  const user2Doc = await User.findById(user2);
  
  if (
    user1Doc?.following?.includes(user2) &&
    user2Doc?.following?.includes(user1)
  ) {
    this.isPermanentlyUnlocked = true;
    this.isLocked = false;
    await this.save();
    return true;
  }
  return false;
};

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;

