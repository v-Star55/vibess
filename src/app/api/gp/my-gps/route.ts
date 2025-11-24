import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Get GPs where user is a member
    const myGPs = await Group.find({
      members: user._id,
      status: { $in: ["active", "converted"] },
    })
      .populate("createdBy", "name username profileImage")
      .populate("members", "name username profileImage")
      .populate("moderator", "name username profileImage")
      .sort({ createdAt: -1 });

    // Separate active and converted GPs
    const activeGPs = myGPs.filter((gp) => {
      if (gp.isPermanent) return true;
      return gp.status === "active" && gp.expiresAt > now;
    });

    const formattedGPs = activeGPs.map((gp) => ({
      _id: gp._id,
      category: gp.category,
      subType: gp.subType,
      specificName: gp.specificName,
      genre: gp.genre,
      talkTopics: gp.talkTopics,
      description: gp.description,
      creationReason: gp.creationReason,
      reasonNote: gp.reasonNote,
      members: gp.members,
      memberCount: gp.members.length,
      maxMembers: gp.maxMembers,
      createdBy: gp.createdBy,
      moderator: gp.moderator,
      expiresAt: gp.expiresAt,
      timeLeft: gp.isPermanent
        ? null
        : Math.max(0, Math.floor((gp.expiresAt.getTime() - now.getTime()) / (1000 * 60))),
      status: gp.status,
      isPermanent: gp.isPermanent,
      isPermanentConversionEligible: gp.isPermanentConversionEligible,
      permanentConversionVotes: gp.permanentConversionVotes,
      createdAt: gp.createdAt,
    }));

    return NextResponse.json({
      success: true,
      gps: formattedGPs,
    });
  } catch (error: any) {
    console.error("My GPs Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


