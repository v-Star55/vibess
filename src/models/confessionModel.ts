import mongoose from "mongoose";

const confessionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    // Anonymous - we store user ID only for rate limiting and reporting
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Expiration
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Reports
    reports: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reportCount: {
      type: Number,
      default: 0,
    },
    // Status
    status: {
      type: String,
      enum: ["active", "removed", "expired"],
      default: "active",
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removedReason: {
      type: String,
      enum: ["reported", "expired", "manual"],
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
confessionSchema.index({ status: 1, expiresAt: 1 });
confessionSchema.index({ createdBy: 1, createdAt: -1 });
confessionSchema.index({ reportCount: 1, status: 1 });

// Method to check if confession is expired
confessionSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Method to check if user already reported
confessionSchema.methods.hasUserReported = function (userId: string) {
  return this.reports.some(
    (report: any) => report.user.toString() === userId.toString()
  );
};

const Confession =
  mongoose.models.Confession || mongoose.model("Confession", confessionSchema);

export default Confession;

