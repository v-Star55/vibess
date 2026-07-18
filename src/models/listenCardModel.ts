import mongoose from "mongoose";

const listenCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    heaviness: {
      type: String,
      enum: ["Light", "Moderate", "Heavy"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "accepted", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    listener: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    offers: [
      {
        listener: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rated: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Index to query active and non-expired cards
listenCardSchema.index({ status: 1, expiresAt: 1 });

const ListenCard = mongoose.models.ListenCard || mongoose.model("ListenCard", listenCardSchema);
export default ListenCard;
