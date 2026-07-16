import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";
import User from "@/src/models/userModel";
import UserProfileDetail from "@/src/models/userProfileDetailModel";
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

    // Get current user's profile details
    const myDetails = await UserProfileDetail.findOne({ user: user._id });

    // Get all other active vibe cards, excluding blocked users (bidirectional)
    const otherVibeCards = await VibeCard.find({
      user: { 
        $ne: user._id,
        $nin: allExcludedUserIds, // Exclude all blocked users (both directions)
      },
      isActive: true,
    }).populate("user", "name username profileImage");

    // Fetch user profile details for other users to match hobbies and personalities
    const otherUserIds = otherVibeCards.map((c) => {
      const u = c.user as any;
      return u?._id || u;
    });
    const otherDetails = await UserProfileDetail.find({
      user: { $in: otherUserIds },
    });

    const detailsMap = new Map();
    otherDetails.forEach((d) => {
      detailsMap.set(d.user.toString(), d);
    });

    // Calculate matches
    const matches = otherVibeCards
      .map((card) => {
        const cardUserId = (card.user as any)?._id?.toString() || card.user?.toString();
        const cardDetails = detailsMap.get(cardUserId);
        
        const matchResult = calculateVibeSimilarity(
          {
            vibeScore: myVibeCard.vibeScore,
            energyLevel: myVibeCard.energyLevel,
            currentIntent: myVibeCard.currentIntent,
            contextTag: myVibeCard.contextTag,
            conversationalPreferences: myVibeCard.conversationalPreferences,
            askMeAbout: myVibeCard.askMeAbout || [],
            feelingOptions: myVibeCard.feelingOptions || [],
            hobbies: myDetails?.hobbies || [],
            personalities: myDetails?.personalities || [],
            coordinates: myVibeCard.location?.coordinates as [number, number],
          },
          {
            vibeScore: card.vibeScore,
            energyLevel: card.energyLevel,
            currentIntent: card.currentIntent,
            contextTag: card.contextTag,
            conversationalPreferences: card.conversationalPreferences,
            askMeAbout: card.askMeAbout || [],
            feelingOptions: card.feelingOptions || [],
            hobbies: cardDetails?.hobbies || [],
            personalities: cardDetails?.personalities || [],
            coordinates: card.location?.coordinates as [number, number],
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
    const interestsTwins = matches.filter((m) => m.category === "Interests Twin");

    return NextResponse.json({
      success: true,
      matches: {
        all: matches,
        moodTwins,
        nearEnergy,
        similarVibes,
        interestsTwins,
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

