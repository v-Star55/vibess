import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";

// Background job to expire old GPs
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

    // Find expired active GPs
    const expiredGPs = await Group.find({
      status: "active",
      expiresAt: { $lte: now },
      isPermanent: false,
    });

    // Mark as expired
    const result = await Group.updateMany(
      {
        status: "active",
        expiresAt: { $lte: now },
        isPermanent: false,
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    // Also mark GPs with no members as failed
    await Group.updateMany(
      {
        status: "active",
        members: { $size: 0 },
      },
      {
        $set: {
          status: "failed",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Expired ${result.modifiedCount} GPs`,
      expiredCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Expire GPs Error:", error);
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


