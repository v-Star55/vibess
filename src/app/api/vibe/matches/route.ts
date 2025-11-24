import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import { calculateVibeSimilarity } from "@/src/app/lib/vibeMatching";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's vibe card
    const myVibeCard = await VibeCard.findOne({ user: user._id, isActive: true });
    if (!myVibeCard) {
      return NextResponse.json(
        { message: "You need to create a vibe card first" },
        { status: 404 }
      );
    }

    // Get current user's blocked users list
    const currentUser = await User.findById(user._id).select("blockedUsers");
    const blockedUserIds = currentUser?.blockedUsers || [];

    // Get all users who have blocked the current user
    const usersWhoBlockedMe = await User.find({
      blockedUsers: user._id,
    }).select("_id");
    const blockedByUserIds = usersWhoBlockedMe.map((u) => u._id);

    // Combine both lists - exclude users blocked by current user AND users who blocked current user
    const allExcludedUserIds = [
      ...blockedUserIds,
      ...blockedByUserIds,
    ];

    // Get all other active vibe cards, excluding blocked users (bidirectional)
    const otherVibeCards = await VibeCard.find({
      user: { 
        $ne: user._id,
        $nin: allExcludedUserIds, // Exclude all blocked users (both directions)
      },
      isActive: true,
    }).populate("user", "name username profileImage");

    // Calculate matches
    const matches = otherVibeCards
      .map((card) => {
        const matchResult = calculateVibeSimilarity(
          {
            vibeScore: myVibeCard.vibeScore,
            energyLevel: myVibeCard.energyLevel,
            currentIntent: myVibeCard.currentIntent,
            contextTag: myVibeCard.contextTag,
            interactionBoundary: myVibeCard.interactionBoundary,
          },
          {
            vibeScore: card.vibeScore,
            energyLevel: card.energyLevel,
            currentIntent: card.currentIntent,
            contextTag: card.contextTag,
            interactionBoundary: card.interactionBoundary,
          }
        );

        return {
          vibeCard: card,
          similarity: matchResult.similarity,
          category: matchResult.category,
          breakdown: matchResult.breakdown,
        };
      })
      .filter((match) => match.similarity >= 70) // Only show matches >= 70%
      .sort((a, b) => b.similarity - a.similarity); // Sort by similarity

    // Group by category
    const moodTwins = matches.filter((m) => m.category === "Mood Twins");
    const nearEnergy = matches.filter((m) => m.category === "Near Your Energy");
    const similarVibes = matches.filter((m) => m.category === "Similar Vibes");

    return NextResponse.json({
      success: true,
      matches: {
        all: matches,
        moodTwins,
        nearEnergy,
        similarVibes,
      },
      myVibe: myVibeCard,
    });
  } catch (error: any) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

