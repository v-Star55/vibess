import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Chat from "@/src/models/chatModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { otherUserId } = await req.json();

    if (!otherUserId) {
      return NextResponse.json(
        { message: "Other user ID is required" },
        { status: 400 }
      );
    }

    // Check if users have blocked each other
    const currentUser = await User.findById(user._id).select("blockedUsers");
    const otherUser = await User.findById(otherUserId).select("blockedUsers");

    // Check if current user has blocked the other user
    if (currentUser?.blockedUsers?.some((blockedId: any) => 
      blockedId.toString() === otherUserId.toString()
    )) {
      return NextResponse.json(
        { message: "Cannot create chat with a blocked user" },
        { status: 403 }
      );
    }

    // Check if other user has blocked the current user
    if (otherUser?.blockedUsers?.some((blockedId: any) => 
      blockedId.toString() === user._id.toString()
    )) {
      return NextResponse.json(
        { message: "Cannot create chat with this user" },
        { status: 403 }
      );
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [user._id, otherUserId] },
    });

    if (existingChat) {
      // Check if it's permanently unlocked
      await existingChat.checkPermanentUnlock();
      
      return NextResponse.json({
        success: true,
        chat: existingChat,
        isNew: false,
      });
    }

    // Create new chat with 24-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const chat = new Chat({
      participants: [user._id, otherUserId],
      messages: [],
      expiresAt,
      isLocked: false,
      isPermanentlyUnlocked: false,
      matchedAt: new Date(),
    });

    await chat.save();

    // Check if both users follow each other (permanent unlock)
    await chat.checkPermanentUnlock();

    return NextResponse.json({
      success: true,
      chat,
      isNew: true,
    });
  } catch (error: any) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create chat" },
      { status: 500 }
    );
  }
}

