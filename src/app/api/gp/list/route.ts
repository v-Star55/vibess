import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Priority scoring function
function calculatePriorityScore(gp: any, user: any, distance: number): number {
  let score = 0;
  const now = new Date();
  const hoursRemaining = (gp.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Priority 1: GPs that need only 1 or 2 more members
  const membersNeeded = gp.maxMembers - gp.members.length;
  if (membersNeeded === 1) score += 100;
  else if (membersNeeded === 2) score += 80;
  else if (membersNeeded === 0) score -= 50; // Full groups get lower priority

  // Priority 2: GPs with more than 1.5 hours remaining
  if (hoursRemaining > 1.5) score += 50;
  else if (hoursRemaining < 0.5) score -= 30; // Low time remaining

  // Priority 3: Distance (nearer = higher score)
  if (distance < 5) score += 40;
  else if (distance < 10) score += 30;
  else if (distance < 25) score += 20;
  else if (distance < 50) score += 10;

  // Priority 4: Recent activity
  const lastActivityHours = (now.getTime() - gp.lastActivityAt.getTime()) / (1000 * 60 * 60);
  if (lastActivityHours < 0.5) score += 20;
  else if (lastActivityHours < 1) score += 10;

  // Priority 5: Message count (engagement indicator)
  if (gp.messageCount > 10) score += 15;
  else if (gp.messageCount > 5) score += 10;

  return score;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's location
    const currentUser = await User.findById(user._id).select("location");
    if (!currentUser || !currentUser.location?.coordinates) {
      return NextResponse.json(
        { message: "User location not available" },
        { status: 400 }
      );
    }

    const [userLon, userLat] = currentUser.location.coordinates;
    const now = new Date();

    // Try different radius levels
    const radiusLevels = [10, 25, 50, 100, 500]; // in km
    let foundGPs: any[] = [];

    for (const radiusKm of radiusLevels) {
      // Convert km to radians (approximate)
      const radiusRadians = radiusKm / 6371;

      const gps = await Group.find({
        status: "active",
        expiresAt: { $gt: now },
        isPermanent: false,
        "location.coordinates": {
          $geoWithin: {
            $centerSphere: [[userLon, userLat], radiusRadians],
          },
        },
        members: { $ne: user._id }, // Exclude GPs user is already in
      })
        .populate("createdBy", "name username profileImage")
        .populate("members", "name username profileImage")
        .sort({ createdAt: -1 })
        .limit(50); // Get more than needed for scoring

      if (gps.length > 0) {
        foundGPs = gps;
        break; // Found GPs, stop expanding radius
      }
    }

    // Calculate distance and priority score for each GP
    const gpsWithScores = foundGPs.map((gp) => {
      const [gpLon, gpLat] = gp.location.coordinates;
      const distance = calculateDistance(userLat, userLon, gpLat, gpLon);
      const priorityScore = calculatePriorityScore(gp, currentUser, distance);

      return {
        ...gp.toObject(),
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        priorityScore,
      };
    });

    // Sort by priority score (highest first)
    gpsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);

    // Return top 7 GPs
    const topGPs = gpsWithScores.slice(0, 7).map((gp) => ({
      _id: gp._id,
      category: gp.category,
      subType: gp.subType,
      specificName: gp.specificName,
      genre: gp.genre,
      talkTopics: gp.talkTopics,
      description: gp.description,
      creationReason: gp.creationReason,
      reasonNote: gp.reasonNote,
      members: gp.members,
      memberCount: gp.members.length,
      maxMembers: gp.maxMembers,
      createdBy: gp.createdBy,
      expiresAt: gp.expiresAt,
      timeLeft: Math.max(0, Math.floor((gp.expiresAt.getTime() - now.getTime()) / (1000 * 60))), // minutes
      distance: gp.distance,
      city: gp.city,
      zone: gp.zone,
      createdAt: gp.createdAt,
    }));

    return NextResponse.json({
      success: true,
      gps: topGPs,
      totalFound: foundGPs.length,
    });
  } catch (error: any) {
    console.error("GP List Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


