import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Confession from "@/src/models/confessionModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const now = new Date();

    // Get active confessions (not removed, not expired)
    const confessions = await Confession.find({
      status: "active",
      expiresAt: { $gt: now },
      reportCount: { $lt: 3 }, // Not reported 3+ times
    })
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .select("text expiresAt createdAt reportCount")
      .lean();

    // Format confessions for response
    const formattedConfessions = confessions.map((confession: any) => ({
      _id: confession._id,
      text: confession.text,
      createdAt: confession.createdAt,
    }));

    // Get total count for pagination
    const total = await Confession.countDocuments({
      status: "active",
      expiresAt: { $gt: now },
      reportCount: { $lt: 3 },
    });

    return NextResponse.json({
      success: true,
      confessions: formattedConfessions,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error: any) {
    console.error("Get Confessions Wall Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

