import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import ListenCard from "@/src/models/listenCardModel";
import Chat from "@/src/models/chatModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import hasActiveListenChat from "@/src/app/helpers/hasActiveListenChat";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { cardId, listenerId } = await req.json();
    if (!cardId || !listenerId) {
      return NextResponse.json(
        { message: "cardId and listenerId are required" },
        { status: 400 }
      );
    }

    // Find card and verify ownership
    const card = await ListenCard.findById(cardId);
    if (!card) {
      return NextResponse.json({ message: "Listen card not found" }, { status: 444 });
    }

    if (card.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "You are not authorized to manage this card" },
        { status: 403 }
      );
    }

    if (card.status !== "active") {
      return NextResponse.json(
        { message: `Cannot select listener. Card is current status: ${card.status}` },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(card.expiresAt)) {
      card.status = "expired";
      await card.save();
      return NextResponse.json({ message: "This card has expired" }, { status: 400 });
    }

    // Verify listener exists in offers list
    const offerIndex = card.offers.findIndex(
      (off: any) => off.listener.toString() === listenerId
    );
    if (offerIndex === -1) {
      return NextResponse.json(
        { message: "This user has not offered to listen to this card" },
        { status: 400 }
      );
    }

    // Concurrency check: Neither participant can have an active, ongoing chat
    const speakerHasChat = await hasActiveListenChat(user._id.toString());
    if (speakerHasChat) {
      return NextResponse.json(
        { message: "You cannot start a session while you are already in an active chat session." },
        { status: 400 }
      );
    }

    const listenerHasChat = await hasActiveListenChat(listenerId);
    if (listenerHasChat) {
      return NextResponse.json(
        { message: "This listener is currently busy in another active chat session." },
        { status: 400 }
      );
    }

    // Create the 5-hour timed chat room
    const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const chat = new Chat({
      participants: [user._id, listenerId],
      messages: [],
      isListenChat: true,
      listenCardId: card._id,
      expiresAt,
    });

    await chat.save();

    // Update card to accepted
    card.status = "accepted";
    card.listener = listenerId;
    card.chat = chat._id;
    await card.save();

    return NextResponse.json({
      success: true,
      message: "Chat room created and listener selected successfully",
      chatId: chat._id,
    });
  } catch (error: any) {
    console.error("Error in select-listener route:", error);
    return NextResponse.json(
      { message: error.message || "Failed to select listener" },
      { status: 500 }
    );
  }
}
