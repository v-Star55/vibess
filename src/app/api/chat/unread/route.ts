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

    const userIdStr = user._id.toString();

    const chats = await Chat.find(
      { participants: user._id },
      { messages: 1 }
    ).lean();

    const unreadCount = chats.reduce((count, chat) => {
      const hasUnread = (chat.messages || []).some((msg: any) => {
        const senderId =
          typeof msg.sender === "string"
            ? msg.sender
            : msg.sender?._id?.toString?.() ?? msg.sender?.toString?.();
        return senderId && senderId !== userIdStr && !msg.read;
      });
      return hasUnread ? count + 1 : count;
    }, 0);

    return NextResponse.json({ success: true, unreadCount });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}

