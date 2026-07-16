import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import ListenCard from "@/src/models/listenCardModel";
import User from "@/src/models/userModel";
import getOrCreateListenProfile from "@/src/app/helpers/getOrCreateListenProfile";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is blocked or banned from the Listen feature in ListenProfile
    const profile = await getOrCreateListenProfile(user._id.toString());
    if (profile.isBlocked) {
      return NextResponse.json(
        { error: "The Listen feature has been blocked for your account due to multiple reports." },
        { status: 403 }
      );
    }

    if (profile.banUntil && new Date() < new Date(profile.banUntil)) {
      return NextResponse.json(
        {
          error: "You are temporarily banned from using the Listen feature.",
          banUntil: profile.banUntil,
        },
        { status: 403 }
      );
    }

    // Get the user's blocked list
    const currentUserDoc = await User.findById(user._id).select("blockedUsers");
    const blockedUserIds = currentUserDoc?.blockedUsers || [];

    // Find active, unexpired cards, excluding ones where the current user already offered to listen
    const now = new Date();
    const cards = await ListenCard.find({
      status: "active",
      expiresAt: { $gt: now },
      user: { $ne: user._id, $nin: blockedUserIds },
      "offers.listener": { $ne: user._id },
    })
      .populate("user", "name username profileImage blockedUsers")
      .sort({ createdAt: -1 });

    // Filter out cards from users who have blocked the current user
    const filteredCards = cards.filter((card: any) => {
      if (!card.user) return false;
      const otherUserBlockedList = card.user.blockedUsers || [];
      return !otherUserBlockedList.some(
        (blockedId: any) => blockedId.toString() === user._id.toString()
      );
    });

    // Strip out the blockedUsers field from the response for privacy/cleanliness
    const cleanCards = filteredCards.map((card: any) => {
      const cardObj = card.toObject();
      if (cardObj.user) {
        delete cardObj.user.blockedUsers;
      }
      return cardObj;
    });

    return NextResponse.json({
      success: true,
      cards: cleanCards,
    });
  } catch (error: any) {
    console.error("Error listing listen cards:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve requests" },
      { status: 500 }
    );
  }
}
