import { NextRequest, NextResponse } from "next/server";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import { enhanceVibeDescription } from "@/src/app/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { emoji, description, energyLevel, currentIntent } = await req.json();

    if (!emoji || !description || energyLevel === undefined || !currentIntent) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate AI-enhanced descriptions
    const suggestions = await enhanceVibeDescription(
      emoji,
      description,
      energyLevel,
      currentIntent
    );

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error("Error enhancing description:", error);
    return NextResponse.json(
      { message: error.message || "Failed to enhance description" },
      { status: 500 }
    );
  }
}

