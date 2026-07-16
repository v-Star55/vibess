import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import ListenCard from "@/src/models/listenCardModel";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
    }

    const card = await ListenCard.findOne({
      _id: cardId,
      user: user._id,
    });

    if (!card) {
      return NextResponse.json({ error: "Active card not found or unauthorized" }, { status: 404 });
    }

    card.status = "cancelled";
    await card.save();

    return NextResponse.json({
      success: true,
      message: "Request cancelled successfully",
      card,
    });
  } catch (error: any) {
    console.error("Error cancelling listen card:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel request" },
      { status: 500 }
    );
  }
}
