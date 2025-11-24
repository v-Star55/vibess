import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Confession from "@/src/models/confessionModel";

// Background job to expire old confessions
// This should be called periodically (e.g., via cron job)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check for API key or admin authentication
    const authHeader = req.headers.get("authorization");
    const apiKey = process.env.INTERNAL_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find expired active confessions
    const result = await Confession.updateMany(
      {
        status: "active",
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: "expired",
          removedAt: now,
          removedReason: "expired",
        },
      }
    );

    // Also remove confessions with 3+ reports
    await Confession.updateMany(
      {
        status: "active",
        reportCount: { $gte: 3 },
      },
      {
        $set: {
          status: "removed",
          removedAt: now,
          removedReason: "reported",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Expired ${result.modifiedCount} confessions`,
      expiredCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Expire Confessions Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET endpoint for manual trigger (with auth)
export async function GET(req: NextRequest) {
  return POST(req);
}

