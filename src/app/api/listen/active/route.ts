import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import ListenCard from "@/src/models/listenCardModel";
import getOrCreateListenProfile from "@/src/app/helpers/getOrCreateListenProfile";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeCard = await ListenCard.findOne({
      user: user._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate("offers.listener", "name username profileImage");

    if (activeCard) {
      const plainCard = activeCard.toObject() as any;
      const offersWithRatings = await Promise.all(
        (plainCard.offers || []).map(async (offer: any) => {
          const listenerId = offer.listener?._id?.toString() ?? offer.listener?.toString();
          if (listenerId) {
            const profile = await getOrCreateListenProfile(listenerId);
            return {
              ...offer,
              listener: {
                ...offer.listener,
                rating: profile.rating,
                ratingCount: profile.ratingCount,
              }
            };
          }
          return offer;
        })
      );
      plainCard.offers = offersWithRatings;

      return NextResponse.json({
        success: true,
        activeCard: plainCard,
      });
    }

    return NextResponse.json({
      success: true,
      activeCard: null,
    });
  } catch (error: any) {
    console.error("Error fetching active listen card:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch active request" },
      { status: 500 }
    );
  }
}
