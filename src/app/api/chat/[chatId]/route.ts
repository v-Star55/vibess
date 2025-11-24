import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Chat from "@/src/models/chatModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const chat = await Chat.findById(chatId)
      .populate("participants", "name username profileImage")
      .populate("messages.sender", "name username profileImage");

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.some((p: any) => p._id.toString() === user._id.toString())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Check expiration
    chat.checkExpiration();
    await chat.checkPermanentUnlock();

    // Mark unread messages as read when user views the chat
    const userIdStr = user._id.toString();
    let updated = false;
    chat.messages.forEach((msg: any) => {
      const senderId =
        typeof msg.sender === "string"
          ? msg.sender
          : msg.sender?._id?.toString?.() ?? msg.sender?.toString?.();
      if (senderId && senderId !== userIdStr && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });
    if (updated) {
      await chat.save();
      await chat.populate("messages.sender", "name username profileImage");
    }

    // Calculate time remaining
    const now = new Date();
    const expiresAt = new Date(chat.expiresAt);
    const timeRemaining = chat.isPermanentlyUnlocked
      ? null
      : Math.max(0, expiresAt.getTime() - now.getTime());

    // Check if 2 hours have passed since first message
    const firstMessageTime = chat.firstMessageAt || chat.matchedAt;
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const timeSinceFirstMessage = now.getTime() - new Date(firstMessageTime).getTime();
    const canShowFollowButton = timeSinceFirstMessage >= twoHoursInMs;

    // Check if current user is following the other user
    const otherUser = chat.participants.find(
      (p: any) => p._id.toString() !== user._id.toString()
    );
    let isFollowing = false;
    if (otherUser) {
      const currentUserDoc = await User.findById(user._id).select("following");
      isFollowing = currentUserDoc?.following?.some(
        (followingId: any) => followingId.toString() === otherUser._id.toString()
      ) || false;
    }

    return NextResponse.json({
      success: true,
      chat,
      timeRemaining, // milliseconds
      canShowFollowButton,
      isFollowing,
    });
  } catch (error: any) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.some((p: any) => p.toString() === user._id.toString())) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, text, reason } = body;

    // Block action should work even if chat is locked
    if (action === "block") {
      // Get the other user (the one being blocked)
      const otherUser = chat.participants.find(
        (p: any) => p.toString() !== user._id.toString()
      );

      if (!otherUser) {
        return NextResponse.json(
          { message: "Could not find user to block" },
          { status: 400 }
        );
      }

      const otherUserId = otherUser.toString();

      // Add to chat blockedBy array
      const userObjectId = typeof user._id === 'string' ? user._id : user._id.toString();
      if (!chat.blockedBy.some((id: any) => id.toString() === userObjectId)) {
        chat.blockedBy.push(user._id);
      }

      // Lock the chat permanently when blocked
      chat.isLocked = true;
      chat.isPermanentlyUnlocked = false;
      await chat.save();

      // Add to user's blockedUsers array (global block)
      const currentUserDoc = await User.findById(user._id);
      if (currentUserDoc) {
        if (!currentUserDoc.blockedUsers) {
          currentUserDoc.blockedUsers = [];
        }
        const isAlreadyBlocked = currentUserDoc.blockedUsers.some(
          (blockedId: any) => blockedId.toString() === otherUserId
        );
        
        if (!isAlreadyBlocked) {
          currentUserDoc.blockedUsers.push(otherUser);
          await currentUserDoc.save();
        }
      }

      return NextResponse.json({
        success: true,
        message: "User blocked successfully. You will no longer see this user in matches.",
      });
    }

    // Check if chat is locked (for other actions like sendMessage, report)
    chat.checkExpiration();
    if (chat.isLocked && !chat.isPermanentlyUnlocked) {
      return NextResponse.json(
        { message: "Chat has expired and is locked" },
        { status: 403 }
      );
    }

    if (action === "sendMessage") {
      if (!text?.trim()) {
        return NextResponse.json(
          { message: "Message text is required" },
          { status: 400 }
        );
      }

      // Track first message time
      if (!chat.firstMessageAt && chat.messages.length === 0) {
        chat.firstMessageAt = new Date();
      }

      chat.messages.push({
        sender: user._id,
        text: text.trim(),
        isIcebreaker: false,
        read: false,
      });

      await chat.save();

      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
        chat,
      });
    } else if (action === "report") {
      if (!reason) {
        return NextResponse.json(
          { message: "Report reason is required" },
          { status: 400 }
        );
      }

      chat.reportedBy.push({
        user: user._id,
        reason,
        reportedAt: new Date(),
      });

      await chat.save();

      return NextResponse.json({
        success: true,
        message: "Report submitted successfully",
      });
    } else if (action === "follow") {
      // Get the other user
      const otherUser = chat.participants.find(
        (p: any) => p.toString() !== user._id.toString()
      );

      if (!otherUser) {
        return NextResponse.json(
          { message: "Could not find user to follow" },
          { status: 400 }
        );
      }

      const otherUserId = otherUser.toString();
      const currentUserDoc = await User.findById(user._id);
      const targetUserDoc = await User.findById(otherUserId);

      if (!currentUserDoc || !targetUserDoc) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Check if already following
      const isFollowing = currentUserDoc.following?.some(
        (followingId: any) => followingId.toString() === otherUserId
      );

      if (isFollowing) {
        return NextResponse.json({
          success: true,
          message: "Already following this user",
          isFollowing: true,
        });
      }

      // Add to current user's following
      if (!currentUserDoc.following) {
        currentUserDoc.following = [];
      }
      currentUserDoc.following.push(otherUserId);

      // Add to target user's followers
      if (!targetUserDoc.followers) {
        targetUserDoc.followers = [];
      }
      targetUserDoc.followers.push(user._id);

      await currentUserDoc.save();
      await targetUserDoc.save();

      // Check if both users follow each other (permanent unlock)
      await chat.checkPermanentUnlock();

      return NextResponse.json({
        success: true,
        message: "User followed successfully",
        isFollowing: true,
        chat,
      });
    } else {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update chat" },
      { status: 500 }
    );
  }
}

