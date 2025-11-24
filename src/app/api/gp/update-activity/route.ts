import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Update GP activity (message count, last activity)
// This should be called when a message is sent in the GP
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { gpId, messageCount } = await req.json();

    if (!gpId) {
      return NextResponse.json(
        { message: "GP ID is required" },
        { status: 400 }
      );
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json(
        { message: "GP not found" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = gp.members.some(
      (memberId: any) => memberId.toString() === user._id.toString()
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this GP" },
        { status: 403 }
      );
    }

    // Update activity
    gp.lastActivityAt = new Date();
    if (messageCount !== undefined) {
      gp.messageCount = messageCount;
    }

    // Set first message time if not set
    if (!gp.firstMessageAt && gp.messageCount > 0) {
      gp.firstMessageAt = new Date();
    }

    await gp.save();

    // Check if GP is now eligible for permanent conversion
    if (gp.checkPermanentEligibility() && !gp.isPermanentConversionEligible) {
      gp.isPermanentConversionEligible = true;
      gp.permanentConversionRequestedAt = new Date();
      await gp.save();
    }

    return NextResponse.json({
      success: true,
      message: "Activity updated",
      isEligibleForConversion: gp.isPermanentConversionEligible,
    });
  } catch (error: any) {
    console.error("Update GP Activity Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


