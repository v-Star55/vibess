import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Chat from "@/src/models/chatModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const chats = await Chat.find({
      participants: user._id,
    })
      .populate("participants", "name username profileImage")
      .sort({ updatedAt: -1 })
      .limit(50);

    const userIdStr = user._id.toString();
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

      const hasUnread = messages.some((msg: any) => {
        const senderId =
          typeof msg.sender === "string"
            ? msg.sender
            : msg.sender?._id?.toString?.() ?? msg.sender?.toString?.();
        return senderId && senderId !== userIdStr && !msg.read;
      });

      const unreadMessages = messages.filter((msg: any) => {
        const senderId =
          typeof msg.sender === "string"
            ? msg.sender
            : msg.sender?._id?.toString?.() ?? msg.sender?.toString?.();
        return senderId && senderId !== userIdStr && !msg.read;
      }).length;

      const otherParticipant = participants.find(
        (participant: any) => participant?._id?.toString() !== userIdStr
      );

      return {
        ...plain,
        lastMessage,
        hasUnread,
        unreadMessages,
        otherParticipant,
        timeRemaining,
      };
    });

    return NextResponse.json({
      success: true,
      chats: chatsWithStatus,
    });
  } catch (error: any) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

