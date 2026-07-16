import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
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

    // Check if current user is blocked or banned from the Listen feature in ListenProfile
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

    // Concurrency check: Listener cannot have an active listen chat
    const listenerHasChat = await hasActiveListenChat(user._id.toString());
    if (listenerHasChat) {
      return NextResponse.json(
        { error: "You cannot offer to listen while you are already in an active listen chat." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }

    const card = await ListenCard.findById(cardId);
    if (!card) {
      return NextResponse.json({ error: "Listen request not found" }, { status: 404 });
    }

    if (card.status !== "active" || new Date() > new Date(card.expiresAt)) {
      return NextResponse.json(
        { error: "This request is no longer active, accepted, or has expired" },
        { status: 400 }
      );
    }

    if (card.user.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "You cannot listen to your own request" },
        { status: 400 }
      );
    }

    // Check if user already offered to listen
    const alreadyOffered = card.offers.some(
      (off: any) => off.listener.toString() === user._id.toString()
    );

    if (alreadyOffered) {
      return NextResponse.json(
        { error: "You have already offered to listen to this request" },
        { status: 400 }
      );
    }

    // Add listener to offers array
    card.offers.push({ listener: user._id });
    await card.save();

    return NextResponse.json({
      success: true,
      message: "Offer to listen submitted successfully",
    });
  } catch (error: any) {
    console.error("Error accepting listen card:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept request" },
      { status: 500 }
    );
  }
}
