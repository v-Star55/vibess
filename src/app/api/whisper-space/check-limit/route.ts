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

    // Check if user has posted in last 1 hour
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const recentConfession = await Confession.findOne({
      createdBy: user._id,
      createdAt: { $gte: oneHourAgo },
      status: "active",
    })
      .sort({ createdAt: -1 })
      .lean() as any;

    if (recentConfession) {
      const timeUntilNext = Math.ceil(
        (new Date(recentConfession.createdAt).getTime() + 1 * 60 * 60 * 1000 - Date.now()) / (1000 * 60)
      );
      const hoursRemaining = Math.floor(timeUntilNext / 60);
      const minutesRemaining = timeUntilNext % 60;

      return NextResponse.json({
        success: true,
        canPost: false,
        timeRemaining: timeUntilNext,
        hoursRemaining,
        minutesRemaining,
        lastPostedAt: recentConfession.createdAt,
        message: "Your heart already spoke. Come back later 🤍",
      });
    }

    return NextResponse.json({
      success: true,
      canPost: true,
      message: "You can post a confession",
    });
  } catch (error: any) {
    console.error("Check Confession Limit Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

