import { NextRequest, NextResponse } from "next/server";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import { generateIcebreakers } from "@/src/app/lib/gemini";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { otherUserId } = await req.json();

    if (!otherUserId) {
      return NextResponse.json(
        { message: "Other user ID is required" },
        { status: 400 }
      );
    }

    // Get both users' vibe cards
    const myVibe = await VibeCard.findOne({ user: user._id, isActive: true });
    const otherVibe = await VibeCard.findOne({
      user: otherUserId,
      isActive: true,
    });

    if (!myVibe || !otherVibe) {
      return NextResponse.json(
        { message: "Vibe cards not found" },
        { status: 404 }
      );
    }

    // Generate AI icebreakers
    const icebreakers = await generateIcebreakers(
      {
        emoji: myVibe.emoji,
        description: myVibe.description,
        energyLevel: myVibe.energyLevel,
        currentIntent: myVibe.currentIntent,
        contextTag: myVibe.contextTag,
      },
      {
        emoji: otherVibe.emoji,
        description: otherVibe.description,
        energyLevel: otherVibe.energyLevel,
        currentIntent: otherVibe.currentIntent,
        contextTag: otherVibe.contextTag,
      }
    );

    return NextResponse.json({
      success: true,
      icebreakers,
    });
  } catch (error: any) {
    console.error("Error generating icebreakers:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate icebreakers" },
      { status: 500 }
    );
  }
}

