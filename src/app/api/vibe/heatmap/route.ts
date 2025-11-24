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

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "50"); // km

    // If no location provided, use default aggregation
    if (lat === 0 && lng === 0) {
      // Get all active vibe cards and aggregate by mood/emoji
      const vibeCards = await VibeCard.find({ isActive: true })
        .select("emoji vibeScore.mood location")
        .limit(1000);

      // Count moods
      const moodCounts: Record<string, number> = {};
      const emojiCounts: Record<string, number> = {};

      vibeCards.forEach((card) => {
        const mood = card.vibeScore.mood;
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        emojiCounts[card.emoji] = (emojiCounts[card.emoji] || 0) + 1;
      });

      // Get top trending moods
      const trendingMoods = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([mood, count]) => ({ mood, count }));

      // Get top trending emojis
      const trendingEmojis = Object.entries(emojiCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([emoji, count]) => ({ emoji, count }));

      return NextResponse.json({
        success: true,
        heatmap: {
          trendingMoods,
          trendingEmojis,
          totalVibes: vibeCards.length,
        },
      });
    }

    // Geospatial query for nearby vibes
    const nearbyVibes = await VibeCard.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      },
    })
      .select("emoji vibeScore.mood vibeScore.energy location")
      .limit(100);

    // Aggregate by mood in the region
    const moodCounts: Record<string, number> = {};
    const emojiCounts: Record<string, number> = {};

    nearbyVibes.forEach((card) => {
      const mood = card.vibeScore.mood;
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      emojiCounts[card.emoji] = (emojiCounts[card.emoji] || 0) + 1;
    });

    const trendingMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([mood, count]) => ({ mood, count }));

    const trendingEmojis = Object.entries(emojiCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));

    return NextResponse.json({
      success: true,
      heatmap: {
        trendingMoods,
        trendingEmojis,
        totalVibes: nearbyVibes.length,
        center: { lat, lng },
        radius,
      },
    });
  } catch (error: any) {
    console.error("Error fetching heatmap:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch heatmap" },
      { status: 500 }
    );
  }
}

