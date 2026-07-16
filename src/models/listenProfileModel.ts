import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

if (mongoose.models.ListenProfile) {
  delete mongoose.models.ListenProfile;
}

const ListenProfile = mongoose.model("ListenProfile", listenProfileSchema);
export default ListenProfile;
