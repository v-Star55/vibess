import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import ListenCard from "@/src/models/listenCardModel";
import getOrCreateListenProfile from "@/src/app/helpers/getOrCreateListenProfile";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { cardId, rating, comment } = await req.json();
    if (!cardId || rating === undefined) {
      return NextResponse.json(
        { message: "cardId and rating are required" },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { message: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Find card and verify ownership
    const card = await ListenCard.findById(cardId);
    if (!card) {
      return NextResponse.json({ message: "Listen card not found" }, { status: 444 });
    }

    if (card.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "You are not authorized to rate this session" },
        { status: 403 }
      );
    }

    if (!card.listener) {
      return NextResponse.json(
        { message: "This session does not have a listener assigned" },
        { status: 400 }
      );
    }

    if (card.rated) {
      return NextResponse.json(
        { message: "You have already rated this listener" },
        { status: 400 }
      );
    }

    // Fetch or create the listener's ListenProfile
    const listenerProfile = await getOrCreateListenProfile(card.listener.toString());

    // Update rating stats
    listenerProfile.ratingCount += 1;
    listenerProfile.ratingSum += numericRating;
    listenerProfile.rating = Number((listenerProfile.ratingSum / listenerProfile.ratingCount).toFixed(2));

    // Append review feedback comment
    listenerProfile.reviews.push({
      reviewer: user._id,
      rating: numericRating,
      comment: (comment || "").trim(),
      heaviness: card.heaviness || "Moderate",
      topic: card.topic || "Listening Session",
    });

    await listenerProfile.save();

    // Mark card as rated
    card.rated = true;
    await card.save();

    return NextResponse.json({
      success: true,
      message: "Listener rated successfully",
      rating: listenerProfile.rating,
    });
  } catch (error: any) {
    console.error("Error in rate-listener route:", error);
    return NextResponse.json(
      { message: error.message || "Failed to rate listener" },
      { status: 500 }
    );
  }
}
