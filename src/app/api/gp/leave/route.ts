import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { gpId } = await req.json();

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
    const memberIndex = gp.members.findIndex(
      (memberId: any) => memberId.toString() === user._id.toString()
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        { message: "You are not a member of this GP" },
        { status: 400 }
      );
    }

    // Remove user from members
    gp.members.splice(memberIndex, 1);
    gp.lastActivityAt = new Date();

    // If user was the creator and GP becomes empty, mark as failed
    if (gp.createdBy.toString() === user._id.toString() && gp.members.length === 0) {
      gp.status = "failed";
    }

    // If user was moderator, remove moderator
    if (gp.moderator && gp.moderator.toString() === user._id.toString()) {
      gp.moderator = null;
    }

    await gp.save();

    return NextResponse.json({
      success: true,
      message: "Successfully left GP",
    });
  } catch (error: any) {
    console.error("GP Leave Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


