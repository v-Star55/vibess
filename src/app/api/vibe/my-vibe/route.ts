import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const vibeCard = await VibeCard.findOne({ user: user._id, isActive: true })
      .populate("user", "name username profileImage");

    if (!vibeCard) {
      return NextResponse.json({
        success: false,
        message: "No active vibe card found",
        vibeCard: null,
      });
    }

    return NextResponse.json({
      success: true,
      vibeCard,
    });
  } catch (error: any) {
    console.error("Error fetching vibe card:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch vibe card" },
      { status: 500 }
    );
  }
}

