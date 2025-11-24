import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Get GP details
export async function GET(
  req: NextRequest,
  { params }: { params: { gpId: string } }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { gpId } = params;

    const gp = await Group.findById(gpId)
      .populate("createdBy", "name username profileImage")
      .populate("members", "name username profileImage")
      .populate("moderator", "name username profileImage");

    if (!gp) {
      return NextResponse.json(
        { message: "GP not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isMember = gp.members.some(
      (member: any) => (member._id || member).toString() === user._id.toString()
    );

    return NextResponse.json({
      success: true,
      gp: {
        _id: gp._id,
        category: gp.category,
        subType: gp.subType,
        specificName: gp.specificName,
        genre: gp.genre,
        talkTopics: gp.talkTopics,
        description: gp.description,
        creationReason: gp.creationReason,
        reasonNote: gp.reasonNote,
        location: {
          coordinates: gp.location.coordinates,
          city: gp.city,
          zone: gp.zone,
        },
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
        permanentConversionRequestedAt: gp.permanentConversionRequestedAt,
        messageCount: gp.messageCount,
        lastActivityAt: gp.lastActivityAt,
        startedAt: gp.startedAt,
        createdAt: gp.createdAt,
        isMember,
      },
    });
  } catch (error: any) {
    console.error("Get GP Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


