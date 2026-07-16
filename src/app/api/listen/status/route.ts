import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import getOrCreateListenProfile from "@/src/app/helpers/getOrCreateListenProfile";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getOrCreateListenProfile(user._id.toString());
    const isBlocked = profile.isBlocked || false;
    const banUntil = profile.banUntil || null;
    const isBanned = banUntil ? new Date() < new Date(banUntil) : false;
    const readyToListen = user.readyToListen || false;

    return NextResponse.json({
      success: true,
      isBlocked,
      isBanned,
      banUntil,
      readyToListen,
    });
  } catch (error: any) {
    console.error("Error fetching listen status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch listen status" },
      { status: 500 }
    );
  }
}
