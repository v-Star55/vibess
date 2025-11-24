import { NextRequest, NextResponse } from "next/server";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Static array of 15 hardcoded advice messages
const ADVICE_ARRAY = [
  "Nurture your friendships.",
  "Take time to relax and recharge.",
  "Believe in yourself and your abilities.",
  "Embrace change and learn from it.",
  "Practice gratitude daily.",
  "Stay curious and keep learning.",
  "Be kind to yourself and others.",
  "Focus on progress, not perfection.",
  "Trust your instincts and intuition.",
  "Celebrate small wins along the way.",
  "Stay present in the moment.",
  "Surround yourself with positive people.",
  "Take care of your mental health.",
  "Follow your passions and dreams.",
  "Remember that setbacks are temporary.",
];

export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Select a random advice from the array
    const randomIndex = Math.floor(Math.random() * ADVICE_ARRAY.length);
    const selectedAdvice = ADVICE_ARRAY[randomIndex];

    return NextResponse.json({
      success: true,
      advice: selectedAdvice,
    });
  } catch (error: any) {
    console.error("Get Daily Advice Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

