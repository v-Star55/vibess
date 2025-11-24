import mongoose from "mongoose";

const dailyAdviceSchema = new mongoose.Schema(
  {
    advice: {
      type: String,
      required: false,
      default: "",
    },
    fetchedAt: {
      type: Date,
      required: false,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure only one document exists
dailyAdviceSchema.statics.getCurrentAdvice = async function () {
  let adviceDoc = await this.findOne();
  if (!adviceDoc) {
    adviceDoc = await this.create({ advice: "", fetchedAt: new Date(0) });
  }
  return adviceDoc;
};

const DailyAdvice =
  mongoose.models.DailyAdvice || mongoose.model("DailyAdvice", dailyAdviceSchema);

export default DailyAdvice;

