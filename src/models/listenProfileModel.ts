import mongoose from "mongoose";

const listenReviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
    heaviness: {
      type: String,
      default: "Moderate",
    },
    topic: {
      type: String,
      default: "Listening Session",
    },
  },
  { timestamps: true }
);

const listenProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    banUntil: {
      type: Date,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    ratingSum: {
      type: Number,
      default: 0,
    },
    totalListenHours: {
      type: Number,
      default: 0,
    },
    processedSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListenCard",
      }
    ],
    reviews: [listenReviewSchema],
  },
  { timestamps: true }
);

if (mongoose.models.ListenProfile) {
  delete mongoose.models.ListenProfile;
}

const ListenProfile = mongoose.model("ListenProfile", listenProfileSchema);
export default ListenProfile;
