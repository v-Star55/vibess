import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Chat from "@/src/models/chatModel";
import ListenCard from "@/src/models/listenCardModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userIdStr = user._id.toString();

    // Fetch all listen chats for the user
    const chats = await Chat.find({
      participants: user._id,
      isListenChat: true,
    })
      .populate("participants", "name username profileImage")
      .populate("listenCardId", "topic heaviness rated status")
      .sort({ updatedAt: -1 });

    const now = new Date();

    const chatsWithStatus = chats.map((chat) => {
      chat.checkExpiration();
      const expiresAt = new Date(chat.expiresAt);
      const timeRemaining = chat.isPermanentlyUnlocked
        ? null
        : Math.max(0, expiresAt.getTime() - now.getTime());

      const plain = chat.toObject();
      const messages = plain.messages || [];
      const participants = plain.participants || [];
      const lastMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

      const otherParticipant = participants.find(
        (p: any) => p?._id?.toString() !== userIdStr
      );

      // Extract card details
      const card = plain.listenCardId;

      return {
        ...plain,
        lastMessage,
        otherParticipant,
        timeRemaining,
        card,
      };
    });

    return NextResponse.json({
      success: true,
      chats: chatsWithStatus,
    });
  } catch (error: any) {
    console.error("Error fetching listen chats:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch listen chats" },
      { status: 500 }
    );
  }
}
