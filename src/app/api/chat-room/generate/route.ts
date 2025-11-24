import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import ChatRoom from "@/src/models/chatRoomModel";
import VibeCard from "@/src/models/vibeCardModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import { calculateVibeSimilarity } from "@/src/app/lib/vibeMatching";

/**
 * Generate chat rooms for users who need them
 * This endpoint creates new 4-person chat rooms based on vibe matching
 * It tries to create diverse groups (mix of low to high energy vibes)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an active chat room
    // Note: In auto-creation mode, we still return existing room but don't prevent creation
    // This allows the expire endpoint to create new rooms when needed
    const existingRoom = await ChatRoom.findOne({
      participants: user._id,
      isExpired: false,
      expiresAt: { $gt: new Date() },
    }).populate("participants", "name username profileImage");

    // Return existing room if it has more than 1 hour left
    if (existingRoom) {
      const timeRemaining = new Date(existingRoom.expiresAt).getTime() - Date.now();
      const hoursRemaining = timeRemaining / (1000 * 60 * 60);
      
      // If room has more than 1 hour left, return it
      if (hoursRemaining > 1) {
        return NextResponse.json({
          success: true,
          message: "You already have an active chat room",
          chatRoom: existingRoom,
        });
      }
      // Otherwise, mark it as expired and create a new one
      existingRoom.isExpired = true;
      await existingRoom.save();
    }

    // Get user's vibe card
    const myVibeCard = await VibeCard.findOne({
      user: user._id,
      isActive: true,
    }).populate("user", "name username profileImage");

    if (!myVibeCard) {
      return NextResponse.json(
        { message: "You need to create a vibe card first" },
        { status: 404 }
      );
    }

    // Get current user's blocked users
    const currentUser = await User.findById(user._id).select("blockedUsers");
    const blockedUserIds = currentUser?.blockedUsers || [];

    // Get users who have blocked the current user
    const usersWhoBlockedMe = await User.find({
      blockedUsers: user._id,
    }).select("_id");
    const blockedByUserIds = usersWhoBlockedMe.map((u) => u._id);

    // Combine blocked lists
    const allExcludedUserIds = [
      ...blockedUserIds,
      ...blockedByUserIds,
      user._id, // Exclude self
    ];

    // Get users who are already in active chat rooms (exclude them to avoid duplicates)
    const activeRooms = await ChatRoom.find({
      isExpired: false,
      expiresAt: { $gt: new Date() },
    }).select("participants");

    const usersInActiveRooms = new Set<string>();
    activeRooms.forEach((room: any) => {
      room.participants.forEach((p: any) => {
        usersInActiveRooms.add(p.toString());
      });
    });

    // Get all eligible users with active vibe cards
    const eligibleVibeCards = await VibeCard.find({
      user: {
        $nin: [...allExcludedUserIds, ...Array.from(usersInActiveRooms)],
      },
      isActive: true,
    }).populate("user", "name username profileImage");

    if (eligibleVibeCards.length < 3) {
      return NextResponse.json({
        success: false,
        message: "Not enough users available to create a chat room (need at least 3 others)",
      });
    }

    // Calculate similarities with all eligible users
    const candidatesWithSimilarity = eligibleVibeCards
      .map((card: any) => {
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
          energyLevel: card.energyLevel,
        };
      })
      .filter((candidate: any) => candidate.similarity >= 60) // Minimum 60% similarity
      .sort((a: any, b: any) => b.similarity - a.similarity);

    if (candidatesWithSimilarity.length < 3) {
      return NextResponse.json({
        success: false,
        message: "Not enough compatible users found",
      });
    }

    // Try to create a diverse group (mix of low, mid, high energy)
    const myEnergyLevel = myVibeCard.energyLevel;
    let selectedParticipants: any[] = [];

    // Categorize candidates by energy level
    const lowEnergy = candidatesWithSimilarity.filter(
      (c: any) => c.energyLevel >= 1 && c.energyLevel <= 3
    );
    const midEnergy = candidatesWithSimilarity.filter(
      (c: any) => c.energyLevel >= 4 && c.energyLevel <= 7
    );
    const highEnergy = candidatesWithSimilarity.filter(
      (c: any) => c.energyLevel >= 8 && c.energyLevel <= 10
    );

    // Categorize current user's energy
    const myEnergyCategory =
      myEnergyLevel <= 3
        ? "low"
        : myEnergyLevel <= 7
        ? "mid"
        : "high";

    // Strategy: Try to get at least one from each category if possible
    // Select 3 others, prioritizing diversity
    const categories = [
      { name: "low", candidates: lowEnergy },
      { name: "mid", candidates: midEnergy },
      { name: "high", candidates: highEnergy },
    ].filter((cat) => cat.candidates.length > 0);

    // Try to pick one from each available category first
    for (const category of categories) {
      if (selectedParticipants.length >= 3) break;
      if (category.candidates.length > 0) {
        // Pick the best match from this category
        const selected = category.candidates[0];
        if (
          !selectedParticipants.some(
            (p: any) => p.vibeCard.user._id.toString() === selected.vibeCard.user._id.toString()
          )
        ) {
          selectedParticipants.push(selected);
        }
      }
    }

    // Fill remaining slots with best overall matches
    if (selectedParticipants.length < 3) {
      for (const candidate of candidatesWithSimilarity) {
        if (selectedParticipants.length >= 3) break;
        const alreadySelected = selectedParticipants.some(
          (p: any) => p.vibeCard.user._id.toString() === candidate.vibeCard.user._id.toString()
        );
        if (!alreadySelected) {
          selectedParticipants.push(candidate);
        }
      }
    }

    // Ensure we have exactly 3 others (plus the current user = 4 total)
    if (selectedParticipants.length < 3) {
      return NextResponse.json({
        success: false,
        message: "Could not find enough diverse users for a chat room",
      });
    }

    // Create the participant list (current user + 3 others)
    const participantIds = [
      user._id,
      ...selectedParticipants.map((p: any) => p.vibeCard.user._id),
    ];

    // Calculate average similarity
    const similarities = selectedParticipants.map((p: any) => p.similarity);
    const averageSimilarity =
      similarities.reduce((a: number, b: number) => a + b, 0) /
      similarities.length;

    // Count energy distribution
    const allEnergyLevels = [
      myEnergyLevel,
      ...selectedParticipants.map((p: any) => p.energyLevel),
    ];
    const vibeDiversity = {
      lowEnergy: allEnergyLevels.filter((e: number) => e >= 1 && e <= 3)
        .length,
      midEnergy: allEnergyLevels.filter((e: number) => e >= 4 && e <= 7)
        .length,
      highEnergy: allEnergyLevels.filter((e: number) => e >= 8 && e <= 10)
        .length,
    };

    // Create chat room (expires in 4 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4);

    const chatRoom = await ChatRoom.create({
      participants: participantIds,
      messages: [],
      expiresAt,
      isExpired: false,
      vibeDiversity,
      averageSimilarity: Math.round(averageSimilarity),
    });

    // Populate participants for response
    const populatedRoom = await ChatRoom.findById(chatRoom._id)
      .populate("participants", "name username profileImage")
      .populate("messages.sender", "name username profileImage");

    return NextResponse.json({
      success: true,
      message: "Chat room created successfully",
      chatRoom: populatedRoom,
    });
  } catch (error: any) {
    console.error("Error generating chat room:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate chat room" },
      { status: 500 }
    );
  }
}

