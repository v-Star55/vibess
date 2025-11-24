import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId, action } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    if (userId === user._id.toString()) {
      return NextResponse.json(
        { message: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const currentUser = await User.findById(user._id);
    const targetUser = await User.findById(userId);

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if users have blocked each other
    const isCurrentUserBlocked = currentUser.blockedUsers?.some(
      (blockedId: any) => blockedId.toString() === userId
    );
    const isTargetUserBlocked = targetUser.blockedUsers?.some(
      (blockedId: any) => blockedId.toString() === user._id.toString()
    );

    if (isCurrentUserBlocked || isTargetUserBlocked) {
      return NextResponse.json(
        { message: "Cannot follow a blocked user" },
        { status: 403 }
      );
    }

    const isFollowing = currentUser.following?.some(
      (followingId: any) => followingId.toString() === userId
    );

    if (action === "follow") {
      if (isFollowing) {
        return NextResponse.json({
          success: true,
          message: "Already following this user",
          isFollowing: true,
        });
      }

      // Add to current user's following
      if (!currentUser.following) {
        currentUser.following = [];
      }
      currentUser.following.push(userId);

      // Add to target user's followers
      if (!targetUser.followers) {
        targetUser.followers = [];
      }
      targetUser.followers.push(user._id);

      await currentUser.save();
      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: "User followed successfully",
        isFollowing: true,
      });
    } else if (action === "unfollow") {
      if (!isFollowing) {
        return NextResponse.json({
          success: true,
          message: "Not following this user",
          isFollowing: false,
        });
      }

      // Remove from current user's following
      currentUser.following = currentUser.following.filter(
        (followingId: any) => followingId.toString() !== userId
      );

      // Remove from target user's followers
      targetUser.followers = targetUser.followers.filter(
        (followerId: any) => followerId.toString() !== user._id.toString()
      );

      await currentUser.save();
      await targetUser.save();

      return NextResponse.json({
        success: true,
        message: "User unfollowed successfully",
        isFollowing: false,
      });
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'follow' or 'unfollow'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in follow/unfollow:", error);
    return NextResponse.json(
      { message: error.message || "Failed to follow/unfollow user" },
      { status: 500 }
    );
  }
}

