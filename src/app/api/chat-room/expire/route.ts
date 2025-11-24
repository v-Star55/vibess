import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import ChatRoom from "@/src/models/chatRoomModel";
import VibeCard from "@/src/models/vibeCardModel";
import User from "@/src/models/userModel";
import { calculateVibeSimilarity } from "@/src/app/lib/vibeMatching";

/**
 * Expire old chat rooms and create new ones
 * This should be called periodically (every 4 hours or via cron)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Find all expired chat rooms
    const expiredRooms = await ChatRoom.find({
      isExpired: false,
      expiresAt: { $lte: new Date() },
    });

    // Mark them as expired
    const expireResult = await ChatRoom.updateMany(
      {
        isExpired: false,
        expiresAt: { $lte: new Date() },
      },
      {
        $set: { isExpired: true },
      }
    );

    console.log(`Expired ${expireResult.modifiedCount} chat rooms`);

    // Get all users with active vibe cards who need new chat rooms
    const usersWithVibes = await VibeCard.find({ isActive: true })
      .populate("user", "name username profileImage blockedUsers")
      .select("user vibeScore energyLevel currentIntent contextTag interactionBoundary");

    // Get users already in active chat rooms
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

    // Filter users who need new chat rooms
    const usersNeedingRooms = usersWithVibes.filter(
      (vibeCard: any) => !usersInActiveRooms.has(vibeCard.user._id.toString())
    );

    // Create new chat rooms for users who need them
    const newRooms: any[] = [];
    const processedUsers = new Set<string>();

    for (const userVibeCard of usersNeedingRooms) {
      if (processedUsers.has(userVibeCard.user._id.toString())) {
        continue; // Already processed in a room
      }

      const userId = userVibeCard.user._id;
      const user = userVibeCard.user as any;

      // Get blocked users for this user
      const blockedUserIds = user.blockedUsers || [];
      const usersWhoBlockedMe = await User.find({
        blockedUsers: userId,
      }).select("_id");
      const blockedByUserIds = usersWhoBlockedMe.map((u: any) => u._id);

      const allExcludedUserIds = [
        ...blockedUserIds,
        ...blockedByUserIds,
        userId,
        ...Array.from(processedUsers),
        ...Array.from(usersInActiveRooms),
      ];

      // Find eligible candidates
      const eligibleVibeCards = usersNeedingRooms.filter(
        (vc: any) =>
          !allExcludedUserIds.includes(vc.user._id.toString()) &&
          !processedUsers.has(vc.user._id.toString())
      );

      if (eligibleVibeCards.length < 3) {
        continue; // Not enough users to create a room
      }

      // Calculate similarities
      const candidatesWithSimilarity = eligibleVibeCards
        .map((card: any) => {
          const matchResult = calculateVibeSimilarity(
            {
              vibeScore: userVibeCard.vibeScore,
              energyLevel: userVibeCard.energyLevel,
              currentIntent: userVibeCard.currentIntent,
              contextTag: userVibeCard.contextTag,
              interactionBoundary: userVibeCard.interactionBoundary,
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
        .filter((c: any) => c.similarity >= 60)
        .sort((a: any, b: any) => b.similarity - a.similarity);

      if (candidatesWithSimilarity.length < 3) {
        continue;
      }

      // Try to create diverse group (similar logic as generate endpoint)
      const lowEnergy = candidatesWithSimilarity.filter(
        (c: any) => c.energyLevel >= 1 && c.energyLevel <= 3
      );
      const midEnergy = candidatesWithSimilarity.filter(
        (c: any) => c.energyLevel >= 4 && c.energyLevel <= 7
      );
      const highEnergy = candidatesWithSimilarity.filter(
        (c: any) => c.energyLevel >= 8 && c.energyLevel <= 10
      );

      const categories = [
        { name: "low", candidates: lowEnergy },
        { name: "mid", candidates: midEnergy },
        { name: "high", candidates: highEnergy },
      ].filter((cat) => cat.candidates.length > 0);

      const selectedParticipants: any[] = [];

      // Pick one from each category first
      for (const category of categories) {
        if (selectedParticipants.length >= 3) break;
        if (category.candidates.length > 0) {
          const selected = category.candidates[0];
          if (
            !selectedParticipants.some(
              (p: any) =>
                p.vibeCard.user._id.toString() ===
                selected.vibeCard.user._id.toString()
            )
          ) {
            selectedParticipants.push(selected);
          }
        }
      }

      // Fill remaining slots
      if (selectedParticipants.length < 3) {
        for (const candidate of candidatesWithSimilarity) {
          if (selectedParticipants.length >= 3) break;
          const alreadySelected = selectedParticipants.some(
            (p: any) =>
              p.vibeCard.user._id.toString() ===
              candidate.vibeCard.user._id.toString()
          );
          if (!alreadySelected) {
            selectedParticipants.push(candidate);
          }
        }
      }

      if (selectedParticipants.length < 3) {
        continue;
      }

      // Create chat room
      const participantIds = [
        userId,
        ...selectedParticipants.map((p: any) => p.vibeCard.user._id),
      ];

      const similarities = selectedParticipants.map((p: any) => p.similarity);
      const averageSimilarity =
        similarities.reduce((a: number, b: number) => a + b, 0) /
        similarities.length;

      const allEnergyLevels = [
        userVibeCard.energyLevel,
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

      newRooms.push(chatRoom);

      // Mark all participants as processed
      participantIds.forEach((id: any) => {
        processedUsers.add(id.toString());
      });
    }

    return NextResponse.json({
      success: true,
      message: `Expired ${expireResult.modifiedCount} rooms and created ${newRooms.length} new rooms`,
      expiredCount: expireResult.modifiedCount,
      createdCount: newRooms.length,
    });
  } catch (error: any) {
    console.error("Error expiring and regenerating chat rooms:", error);
    return NextResponse.json(
      { message: error.message || "Failed to expire and regenerate rooms" },
      { status: 500 }
    );
  }
}

