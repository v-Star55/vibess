import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";
import User from "@/src/models/userModel"; // Import User for population to work
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Helper to apply random offset if user does not wish to show exact location
function applyFuzzyOffset(coordinates: number[], showExact: boolean): number[] {
  if (showExact || !coordinates || coordinates.length < 2) return coordinates;
  // Random offset between -0.006 and +0.006 degrees (approx 500m to 1km)
  const lngOffset = (Math.random() - 0.5) * 0.012;
  const latOffset = (Math.random() - 0.5) * 0.012;
  return [coordinates[0] + lngOffset, coordinates[1] + latOffset];
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    try {
      const indexes = await VibeCard.collection.getIndexes();
      console.log("Current VibeCard indexes:", indexes);
      
      // Check if location_2dsphere index exists
      if (!indexes.location_2dsphere) {
        console.log("location_2dsphere index not found. Cleaning up invalid locations and syncing...");
        
        // Proactively clean up/correct any legacy malformed coordinates in the DB
        const allCards = await VibeCard.find({});
        for (const card of allCards) {
          let needsUpdate = false;
          let latVal = 0;
          let lngVal = 0;
          
          if (!card.location || card.location.type !== "Point" || !Array.isArray(card.location.coordinates)) {
            needsUpdate = true;
          } else {
            const coords = card.location.coordinates;
            if (coords.length !== 2 || typeof coords[0] !== "number" || typeof coords[1] !== "number") {
              needsUpdate = true;
            } else {
              lngVal = coords[0];
              latVal = coords[1];
              if (lngVal < -180 || lngVal > 180 || latVal < -90 || latVal > 90) {
                needsUpdate = true;
                lngVal = Math.max(-180, Math.min(180, lngVal || 0));
                latVal = Math.max(-90, Math.min(90, latVal || 0));
              }
            }
          }
          
          if (needsUpdate) {
            console.log(`Fixing malformed coordinates for VibeCard ${card._id}`);
            await VibeCard.updateOne(
              { _id: card._id },
              { 
                $set: { 
                  location: { 
                    type: "Point", 
                    coordinates: [lngVal || 0, latVal || 0] 
                  } 
                } 
              }
            );
          }
        }

        // Drop the incorrect subfield index if it exists
        if (indexes["location.coordinates_2dsphere"]) {
          console.log("Dropping location.coordinates_2dsphere index...");
          await VibeCard.collection.dropIndex("location.coordinates_2dsphere");
        }
        
        console.log("Creating location_2dsphere index...");
        await VibeCard.collection.createIndex({ location: "2dsphere" });
        console.log("location_2dsphere index created successfully!");
      }
    } catch (indexError: any) {
      console.error("VibeCard manual index sync failed:", indexError.message || indexError);
    }

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "50"); // km
    const visual = searchParams.get("visual") === "true";

    // If no location provided, use default aggregation
    if (lat === 0 && lng === 0) {
      // Get active vibe cards
      let query = VibeCard.find({ isActive: true });
      
      if (visual) {
        query = query.populate({
          path: "user",
          match: { appearInHeatmap: { $ne: false } },
          select: "name username profileImage appearInHeatmap showExactDistance"
        });
      } else {
        query = query.select("emoji vibeScore.mood location");
      }
      
      const vibeCards = await query.limit(1000);

      // Filter cards where populated user exists (meaning they have appearInHeatmap != false)
      const visibleCards = visual ? vibeCards.filter((card) => card.user) : vibeCards;

      // Count moods & emojis
      const moodCounts: Record<string, number> = {};
      const emojiCounts: Record<string, number> = {};

      visibleCards.forEach((card) => {
        const mood = card.vibeScore?.mood;
        if (mood) {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        }
        if (card.emoji) {
          emojiCounts[card.emoji] = (emojiCounts[card.emoji] || 0) + 1;
        }
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

      const heatmapData: Record<string, any> = {
        trendingMoods,
        trendingEmojis,
        totalVibes: visibleCards.length,
      };

      if (visual) {
        heatmapData.vibes = visibleCards.map((card: any) => {
          const showExact = card.user?.showExactDistance !== false;
          const rawCoords = card.location?.coordinates || [0, 0];
          const fuzziedCoords = applyFuzzyOffset(rawCoords, showExact);
          return {
            _id: card._id,
            emoji: card.emoji,
            description: card.description,
            theme: card.theme,
            currentIntent: card.currentIntent,
            vibeScore: card.vibeScore,
            location: {
              type: "Point",
              coordinates: fuzziedCoords
            },
            user: {
              name: card.user?.name || "Anonymous",
              username: card.user?.username || "anonymous",
              profileImage: card.user?.profileImage || ""
            }
          };
        });
      }

      return NextResponse.json({
        success: true,
        heatmap: heatmapData,
      });
    }

    // Geospatial query for nearby vibes
    let nearbyQuery = VibeCard.find({
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
    });

    if (visual) {
      nearbyQuery = nearbyQuery.populate({
        path: "user",
        match: { appearInHeatmap: { $ne: false } },
        select: "name username profileImage appearInHeatmap showExactDistance"
      });
    } else {
      nearbyQuery = nearbyQuery.select("emoji vibeScore.mood vibeScore.energy location");
    }

    const nearbyVibes = await nearbyQuery.limit(100);
    const visibleNearby = visual ? nearbyVibes.filter((card) => card.user) : nearbyVibes;

    // Aggregate by mood in the region
    const moodCounts: Record<string, number> = {};
    const emojiCounts: Record<string, number> = {};

    visibleNearby.forEach((card) => {
      const mood = card.vibeScore?.mood;
      if (mood) {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      }
      if (card.emoji) {
        emojiCounts[card.emoji] = (emojiCounts[card.emoji] || 0) + 1;
      }
    });

    const trendingMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([mood, count]) => ({ mood, count }));

    const trendingEmojis = Object.entries(emojiCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));

    const heatmapData: Record<string, any> = {
      trendingMoods,
      trendingEmojis,
      totalVibes: visibleNearby.length,
      center: { lat, lng },
      radius,
    };

    if (visual) {
      heatmapData.vibes = visibleNearby.map((card: any) => {
        const showExact = card.user?.showExactDistance !== false;
        const rawCoords = card.location?.coordinates || [0, 0];
        const fuzziedCoords = applyFuzzyOffset(rawCoords, showExact);
        return {
          _id: card._id,
          emoji: card.emoji,
          description: card.description,
          theme: card.theme,
          currentIntent: card.currentIntent,
          vibeScore: card.vibeScore,
          location: {
            type: "Point",
            coordinates: fuzziedCoords
          },
          user: {
            name: card.user?.name || "Anonymous",
            username: card.user?.username || "anonymous",
            profileImage: card.user?.profileImage || ""
          }
        };
      });
    }

    return NextResponse.json({
      success: true,
      heatmap: heatmapData,
    });
  } catch (error: any) {
    console.error("Error fetching heatmap:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch heatmap" },
      { status: 500 }
    );
  }
}

