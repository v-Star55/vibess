import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";
import mongoose from "mongoose";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await context.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    const vibeCard = await VibeCard.findOne({ user: userId, isActive: true }).populate(
      "user",
      "name username profileImage"
    );

    if (!vibeCard) {
      return NextResponse.json({ message: "No active vibe card found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        vibeCard,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user vibe:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to fetch user vibe" },
      { status: 500 }
    );
  }
}

