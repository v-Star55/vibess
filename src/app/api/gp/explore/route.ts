import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group, { GP_CATEGORIES } from "@/src/models/groupModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subType = searchParams.get("subType");
    const vibeType = searchParams.get("vibeType");
    const topic = searchParams.get("topic");
    const minTimeRemaining = searchParams.get("minTimeRemaining"); // in hours
    const maxDistance = searchParams.get("maxDistance"); // in km
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const now = new Date();

    // Build query
    const query: any = {
      status: "active",
      expiresAt: { $gt: now },
      isPermanent: false,
      members: { $ne: user._id }, // Exclude GPs user is already in
    };

    if (category && GP_CATEGORIES.includes(category as any)) {
      query.category = category;
    }

    if (subType) {
      query.subType = { $regex: subType, $options: "i" };
    }

    if (vibeType) {
      query.subType = vibeType;
    }

    if (topic) {
      query.talkTopics = { $in: [topic] };
    }

    // Get user location if available (for distance filtering)
    const currentUser = await User.findById(user._id).select("location");
    let userLat: number | null = null;
    let userLon: number | null = null;

    if (currentUser?.location?.coordinates) {
      [userLon, userLat] = currentUser.location.coordinates;
    }

    // Find GPs
    let gps = await Group.find(query)
      .populate("createdBy", "name username profileImage")
      .populate("members", "name username profileImage")
      .sort({ createdAt: -1 })
      .limit(limit * 2); // Get more for filtering

    // Filter by time remaining
    if (minTimeRemaining) {
      const minHours = parseFloat(minTimeRemaining);
      gps = gps.filter((gp) => {
        const hoursRemaining = (gp.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursRemaining >= minHours;
      });
    }

    // Calculate distance and filter by max distance if user location available
    const gpsWithDistance = gps.map((gp) => {
      const [gpLon, gpLat] = gp.location.coordinates;
      let distance = null;

      if (userLat !== null && userLon !== null) {
        distance = calculateDistance(userLat, userLon, gpLat, gpLon);
      }

      return {
        gp,
        distance,
      };
    });

    // Filter by max distance
    let filteredGPs = gpsWithDistance;
    if (maxDistance && userLat !== null) {
      const maxDistKm = parseFloat(maxDistance);
      filteredGPs = gpsWithDistance.filter((item) => item.distance === null || item.distance <= maxDistKm);
    }

    // Priority: GPs that need 1-2 users, then by time remaining, then by distance
    filteredGPs.sort((a, b) => {
      const aMembersNeeded = a.gp.maxMembers - a.gp.members.length;
      const bMembersNeeded = b.gp.maxMembers - b.gp.members.length;

      // Priority 1: Members needed
      if (aMembersNeeded !== bMembersNeeded) {
        if (aMembersNeeded <= 2 && bMembersNeeded > 2) return -1;
        if (aMembersNeeded > 2 && bMembersNeeded <= 2) return 1;
        return aMembersNeeded - bMembersNeeded;
      }

      // Priority 2: Time remaining (more is better)
      const aTimeRemaining = (a.gp.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      const bTimeRemaining = (b.gp.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (Math.abs(aTimeRemaining - bTimeRemaining) > 0.1) {
        return bTimeRemaining - aTimeRemaining;
      }

      // Priority 3: Distance (nearer is better)
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }

      // Priority 4: Recent activity
      return b.gp.lastActivityAt.getTime() - a.gp.lastActivityAt.getTime();
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedGPs = filteredGPs.slice(startIndex, startIndex + limit);

    // Format response
    const formattedGPs = paginatedGPs.map(({ gp, distance }) => ({
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
      timeLeft: Math.max(0, Math.floor((gp.expiresAt.getTime() - now.getTime()) / (1000 * 60))),
      distance: distance ? Math.round(distance * 10) / 10 : null,
      city: gp.city,
      zone: gp.zone,
      createdAt: gp.createdAt,
    }));

    return NextResponse.json({
      success: true,
      gps: formattedGPs,
      pagination: {
        page,
        limit,
        total: filteredGPs.length,
        hasMore: startIndex + limit < filteredGPs.length,
      },
    });
  } catch (error: any) {
    console.error("GP Explore Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


