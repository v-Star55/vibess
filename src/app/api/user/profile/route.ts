import { NextRequest, NextResponse } from 'next/server';
import jwt from "jsonwebtoken";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import ListenCard from "@/src/models/listenCardModel";
import Chat from "@/src/models/chatModel";

import getOrCreateListenProfile from "@/src/app/helpers/getOrCreateListenProfile";
import getOrCreateProfileDetails from "@/src/app/helpers/getOrCreateProfileDetails";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "No token" }, { status: 401 });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const followers = user.followers.length;
    const following = user.following.length;

    // Fetch ListenProfile
    const listenProfile = await getOrCreateListenProfile(user._id.toString());
    
    // Populate reviews reviewer details
    if (listenProfile.reviews && listenProfile.reviews.length > 0) {
      await listenProfile.populate({
        path: "reviews.reviewer",
        select: "name username profileImage"
      });
    }

    // Fetch ProfileDetails
    const profileDetails = await getOrCreateProfileDetails(user._id.toString());

    // Fetch only the accepted listen cards where this user was the listener and not yet processed
    const unprocessedSessions = await ListenCard.find({
      listener: user._id,
      status: "accepted",
      _id: { $nin: listenProfile.processedSessions || [] }
    }).populate("chat");

    let updated = false;
    const nowTime = Date.now();
    let currentTotalHours = listenProfile.totalListenHours || 0;
    let activeDurationMs = 0;

    for (const session of unprocessedSessions) {
      if (session.chat) {
        const chatObj: any = session.chat;
        const expiresAtTime = new Date(chatObj.expiresAt).getTime();
        const createdAtTime = new Date(chatObj.createdAt).getTime();
        const isExpiredOrLocked = chatObj.isLocked || nowTime > expiresAtTime;
        
        // Calculate duration
        let sessionMs = 0;
        if (chatObj.messages && chatObj.messages.length > 0) {
          const lastMsgTime = new Date(chatObj.messages[chatObj.messages.length - 1].createdAt).getTime();
          sessionMs = lastMsgTime - createdAtTime;
          if (sessionMs < 0) sessionMs = 0;
          const maxDuration = expiresAtTime - createdAtTime;
          if (sessionMs > maxDuration) sessionMs = maxDuration;
        } else {
          // No messages sent, check if it's active. If active, count from creation to now.
          if (!isExpiredOrLocked) {
            sessionMs = nowTime - createdAtTime;
            if (sessionMs < 0) sessionMs = 0;
            const maxDuration = expiresAtTime - createdAtTime;
            if (sessionMs > maxDuration) sessionMs = maxDuration;
          }
        }

        if (isExpiredOrLocked) {
          // The session has ended. We can permanently cache this duration.
          currentTotalHours += sessionMs / (1000 * 60 * 60);
          if (!listenProfile.processedSessions) {
            listenProfile.processedSessions = [];
          }
          listenProfile.processedSessions.push(session._id);
          updated = true;
        } else {
          // The session is still active. Accumulate live active duration.
          activeDurationMs += sessionMs;
        }
      }
    }

    if (updated) {
      listenProfile.totalListenHours = Number(currentTotalHours.toFixed(2));
      await listenProfile.save();
    }

    // The final display total is the cached total plus any ongoing active session hours
    const totalListenHours = Number((listenProfile.totalListenHours + (activeDurationMs / (1000 * 60 * 60))).toFixed(1));

    const profile = {
      user,
      followers,
      following,
      listenProfile: {
        rating: listenProfile.rating,
        ratingCount: listenProfile.ratingCount,
        reviews: listenProfile.reviews || [],
        totalListenHours: totalListenHours,
      },
      profileDetails,
    };

    return NextResponse.json({ message: "Profile fetched successfully", profile }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
