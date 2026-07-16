import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Confession from "@/src/models/confessionModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

function calculateDistance(coords1: number[], coords2: number[]): number | null {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) return null;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  if (lon1 === 0 && lat1 === 0) return null;
  if (lon2 === 0 && lat2 === 0) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getStableFallbackDistance(id: string): string {
  const num = parseInt(id.slice(-4), 16) || 0;
  return ((num % 80) / 10 + 0.5).toFixed(1) + "km";
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter") || "global"; // "global" | "nearby" | "trending"

    // Fetch user coordinates to calculate distance / run nearby query
    const dbUser = await User.findById(user._id).select("location");
    const userCoords = dbUser?.location?.coordinates || [0, 0];

    const hasValidCoords =
      Array.isArray(userCoords) &&
      userCoords.length >= 2 &&
      typeof userCoords[0] === "number" &&
      typeof userCoords[1] === "number" &&
      userCoords[0] !== 0 &&
      userCoords[1] !== 0;

    const now = new Date();

    // Get active confessions (not removed, not expired)
    let query: any = {
      status: "active",
      expiresAt: { $gt: now },
      reportCount: { $lt: 3 }, // Not reported 3+ times
    };

    let sort: any = { createdAt: -1 };

    if (filter === "trending") {
      sort = { relateCount: -1, createdAt: -1 };
    }

    if (filter === "nearby" && hasValidCoords) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: userCoords,
          },
          $maxDistance: 50000 // 50km limit
        }
      };
    }

    let confessionsQuery = Confession.find(query);
    if (!(filter === "nearby" && hasValidCoords)) {
      confessionsQuery = confessionsQuery.sort(sort);
    }

    const confessions = await confessionsQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .select("text expiresAt createdAt mood location relates relateCount")
      .lean();

    // Format confessions for response
    const formattedConfessions = confessions.map((c: any) => {
      let distStr = "";
      
      const hasValidConfCoords =
        c.location &&
        Array.isArray(c.location.coordinates) &&
        c.location.coordinates.length >= 2 &&
        typeof c.location.coordinates[0] === "number" &&
        typeof c.location.coordinates[1] === "number" &&
        c.location.coordinates[0] !== 0 &&
        c.location.coordinates[1] !== 0;

      if (hasValidConfCoords && hasValidCoords) {
        const distance = calculateDistance(userCoords, c.location.coordinates);
        distStr = distance !== null ? `${distance.toFixed(1)}km` : getStableFallbackDistance(c._id ? c._id.toString() : "");
      } else {
        distStr = getStableFallbackDistance(c._id ? c._id.toString() : "");
      }

      const hasRelated = Array.isArray(c.relates)
        ? c.relates.some((id: any) => id && id.toString() === user._id.toString())
        : false;

      return {
        _id: c._id,
        text: c.text,
        createdAt: c.createdAt,
        mood: c.mood || "chill",
        relates: c.relateCount || 0,
        hasRelated,
        dist: distStr,
      };
    });

    // Get total count for pagination
    const total = await Confession.countDocuments(query);

    return NextResponse.json({
      success: true,
      confessions: formattedConfessions,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error: any) {
    console.error("Get Confessions Wall Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

