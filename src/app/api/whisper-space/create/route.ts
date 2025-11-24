import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Confession from "@/src/models/confessionModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import { moderateContent } from "@/src/app/lib/gemini";

// Helper function to detect PII (phone numbers, emails, addresses, names)
function containsPII(text: string): boolean {
  // Phone number patterns
  const phonePattern = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}/;
  
  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  // Address pattern (simple detection)
  const addressPattern = /\d+\s+[A-Za-z0-9\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|circle|cir)/i;
  
  // Common name patterns (basic detection - could be improved)
  // This is a simple check for capitalized words that might be names
  const commonNameIndicators = /\b(?:call me|I am|my name is|this is|from)\s+[A-Z][a-z]+\b/i;
  
  return (
    phonePattern.test(text) ||
    emailPattern.test(text) ||
    addressPattern.test(text) ||
    commonNameIndicators.test(text)
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { message: "Confession text is required" },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();

    // Validation: Max 300 characters
    if (trimmedText.length === 0) {
      return NextResponse.json(
        { message: "Confession cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedText.length > 300) {
      return NextResponse.json(
        { message: "Confession must be 300 characters or less" },
        { status: 400 }
      );
    }

    // Check for PII
    if (containsPII(trimmedText)) {
      return NextResponse.json(
        { message: "Confession cannot contain phone numbers, names, addresses, or other personal information" },
        { status: 400 }
      );
    }

    // Check rate limit: 1 confession per 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentConfession = await Confession.findOne({
      createdBy: user._id,
      createdAt: { $gte: sixHoursAgo },
      status: "active",
    });

    if (recentConfession) {
      const timeUntilNext = Math.ceil(
        (recentConfession.createdAt.getTime() + 6 * 60 * 60 * 1000 - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        { 
          message: "Your heart already spoke. Come back later 🤍",
          timeRemaining: timeUntilNext,
        },
        { status: 403 }
      );
    }

    // Toxicity filter using Gemini AI
    try {
      const moderationResult = await moderateContent(trimmedText);
      if (!moderationResult.isSafe) {
        return NextResponse.json(
          { message: moderationResult.reason || "Content does not meet our community guidelines" },
          { status: 400 }
        );
      }
    } catch (aiError) {
      // If AI moderation fails, allow it but log the error
      console.error("AI moderation failed:", aiError);
      // For now, continue - in production you might want to be more strict
    }

    // Create confession
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    const confession = new Confession({
      text: trimmedText,
      createdBy: user._id,
      expiresAt,
      status: "active",
      reportCount: 0,
      reports: [],
    });

    await confession.save();

    return NextResponse.json({
      success: true,
      message: "Confession posted anonymously",
      confession: {
        _id: confession._id,
        text: confession.text,
        expiresAt: confession.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Create Confession Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

