import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import ChatRoom from "@/src/models/chatRoomModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

/**
 * Get a specific chat room
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await context.params;

    const chatRoom = await ChatRoom.findById(roomId)
      .populate("participants", "name username profileImage")
      .populate("messages.sender", "name username profileImage");

    if (!chatRoom) {
      return NextResponse.json(
        { message: "Chat room not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (!chatRoom.isParticipant(user._id.toString())) {
      return NextResponse.json(
        { message: "You are not a participant in this chat room" },
        { status: 403 }
      );
    }

    // Check if expired
    if (chatRoom.checkExpiration()) {
      await chatRoom.save();
      return NextResponse.json({
        success: false,
        message: "Chat room has expired",
        chatRoom,
      });
    }

    return NextResponse.json({
      success: true,
      chatRoom,
    });
  } catch (error: any) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch chat room" },
      { status: 500 }
    );
  }
}

/**
 * Send a message to a chat room
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await context.params;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { message: "Message text is required" },
        { status: 400 }
      );
    }

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return NextResponse.json(
        { message: "Chat room not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (!chatRoom.isParticipant(user._id.toString())) {
      return NextResponse.json(
        { message: "You are not a participant in this chat room" },
        { status: 403 }
      );
    }

    // Check if expired
    if (chatRoom.checkExpiration()) {
      await chatRoom.save();
      return NextResponse.json(
        { message: "Chat room has expired" },
        { status: 400 }
      );
    }

    // Add message
    chatRoom.messages.push({
      sender: user._id,
      text: text.trim(),
      readBy: [user._id], // Mark as read by sender
    });

    await chatRoom.save();

    // Return updated chat room
    const updatedRoom = await ChatRoom.findById(roomId)
      .populate("participants", "name username profileImage")
      .populate("messages.sender", "name username profileImage");

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      chatRoom: updatedRoom,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { message: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

