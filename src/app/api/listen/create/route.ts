import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import User from "@/src/models/userModel";
import ListenCard from "@/src/models/listenCardModel";

import getOrCreateListenProfile from "@/src/app/helpers/getOrCreateListenProfile";
import hasActiveListenChat from "@/src/app/helpers/hasActiveListenChat";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is blocked or banned from the Listen feature in ListenProfile
    const profile = await getOrCreateListenProfile(user._id.toString());
    if (profile.isBlocked) {
      return NextResponse.json(
        { error: "The Listen feature has been blocked for your account due to multiple reports." },
        { status: 403 }
      );
    }

    if (profile.banUntil && new Date() < new Date(profile.banUntil)) {
      return NextResponse.json(
        {
          error: "You are temporarily banned from using the Listen feature.",
          banUntil: profile.banUntil,
        },
        { status: 403 }
      );
    }

    // Check concurrency: Cannot create a card if user is in an active chat
    const speakerHasChat = await hasActiveListenChat(user._id.toString());
    if (speakerHasChat) {
      return NextResponse.json(
        { error: "You cannot create a new request while you are currently in an active listen session." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { topic, reason, heaviness } = body;

    // Validation
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (topic.length > 100) {
      return NextResponse.json({ error: "Topic must be 100 characters or less" }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }
    if (reason.length > 1000) {
      return NextResponse.json({ error: "Reason must be 1000 characters or less" }, { status: 400 });
    }

    if (!["Light", "Moderate", "Heavy"].includes(heaviness)) {
      return NextResponse.json({ error: "Heaviness must be Light, Moderate, or Heavy" }, { status: 400 });
    }

    // Check for existing active, non-expired card for this user
    const existingCard = await ListenCard.findOne({
      user: user._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    });

    if (existingCard) {
      return NextResponse.json(
        { error: "You already have an active request. Please cancel it before creating a new one." },
        { status: 400 }
      );
    }

    // Expiration set to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const card = new ListenCard({
      user: user._id,
      topic: topic.trim(),
      reason: reason.trim(),
      heaviness,
      expiresAt,
    });

    await card.save();

    return NextResponse.json({
      success: true,
      message: "Listen card created successfully",
      card,
    });
  } catch (error: any) {
    console.error("Error creating listen card:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create listen request" },
      { status: 500 }
    );
  }
}
