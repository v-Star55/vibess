import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import ChatRoom from "@/src/models/chatRoomModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

/**
 * Get all active chat rooms for the current user
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find all active chat rooms where user is a participant
    const chatRooms = await ChatRoom.find({
      participants: user._id,
      isExpired: false,
      expiresAt: { $gt: new Date() },
    })
      .populate("participants", "name username profileImage")
      .populate("messages.sender", "name username profileImage")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      chatRooms,
    });
  } catch (error: any) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}

