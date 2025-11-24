import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import VibeCard from "@/src/models/vibeCardModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import { calculateVibeScore } from "@/src/app/lib/vibeScoreCalculator";
import { generateTheme } from "@/src/app/lib/themeGenerator";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      emoji,
      description,
      energyLevel,
      currentIntent,
      contextTag,
      interactionBoundary,
      feelingOptions,
      vibeAvailability,
      personalityPrompt,
      location,
    } = body;

    // Validation
    if (!emoji || !description || energyLevel === undefined || !currentIntent || !interactionBoundary) {
      return NextResponse.json(
        { message: "Emoji, description, energyLevel, currentIntent, and interactionBoundary are required" },
        { status: 400 }
      );
    }

    // Validate energyLevel
    if (energyLevel < 1 || energyLevel > 10) {
      return NextResponse.json(
        { message: "Energy level must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Validate currentIntent
    if (!Array.isArray(currentIntent) || currentIntent.length < 1 || currentIntent.length > 2) {
      return NextResponse.json(
        { message: "Must select 1-2 intents" },
        { status: 400 }
      );
    }

    // Validate description length (2-8 words)
    const wordCount = description.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
    if (wordCount < 2 || wordCount > 8) {
      return NextResponse.json(
        { message: "Description must be 2-8 words" },
        { status: 400 }
      );
    }

    // Calculate vibe score
    const vibeScore = calculateVibeScore({
      emoji,
      description,
      energyLevel,
      currentIntent,
      contextTag,
    });

    // Generate theme
    const theme = generateTheme("general", vibeScore.energy, emoji);

    // Prepare location data
    const locationData = location
      ? {
          type: "Point",
          coordinates: [location.longitude || 0, location.latitude || 0],
        }
      : {
          type: "Point",
          coordinates: [0, 0],
        };

    // Prepare vibe card data
    const vibeCardData: any = {
      emoji,
      description: description.trim(),
      energyLevel,
      currentIntent,
      contextTag: contextTag || "",
      interactionBoundary,
      feelingOptions: Array.isArray(feelingOptions) ? feelingOptions : [],
      vibeAvailability: vibeAvailability || "",
      personalityPrompt: personalityPrompt || "",
      theme,
      vibeScore,
      location: locationData,
      lastUpdated: new Date(),
      isActive: true,
    };

    // Check if user already has a vibe card
    const existingCard = await VibeCard.findOne({ user: user._id });

    if (existingCard) {
      // Update existing card
      const updatedCard = await VibeCard.findOneAndUpdate(
        { user: user._id },
        { $set: vibeCardData },
        { new: true, runValidators: true }
      );

      if (!updatedCard) {
        return NextResponse.json(
          { message: "Failed to update vibe card" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Vibe card updated successfully",
        vibeCard: updatedCard,
      });
    } else {
      // Create new card
      const vibeCard = new VibeCard({
        user: user._id,
        ...vibeCardData,
      });

      await vibeCard.save();

      return NextResponse.json({
        success: true,
        message: "Vibe card created successfully",
        vibeCard,
      });
    }
  } catch (error: any) {
    console.error("Error creating/updating vibe card:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create vibe card" },
      { status: 500 }
    );
  }
}
