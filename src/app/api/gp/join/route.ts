import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import User from "@/src/models/userModel";
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

    const gp = await Group.findById(gpId).populate("members", "name username profileImage");
    if (!gp) {
      return NextResponse.json(
        { message: "GP not found" },
        { status: 404 }
      );
    }

    // Check if GP is active
    const now = new Date();
    if (gp.status !== "active" || gp.expiresAt <= now) {
      return NextResponse.json(
        { message: "This GP is no longer active" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    if (gp.members.some((member: any) => member._id.toString() === user._id.toString())) {
      return NextResponse.json(
        { message: "You are already a member of this GP" },
        { status: 400 }
      );
    }

    // Check if GP is full
    if (gp.members.length >= gp.maxMembers) {
      return NextResponse.json(
        { message: "This GP is full" },
        { status: 400 }
      );
    }

    // Add user to GP
    gp.members.push(user._id);
    gp.lastActivityAt = now;
    await gp.save();

    // Populate the updated members
    await gp.populate("members", "name username profileImage");
    await gp.populate("createdBy", "name username profileImage");

    return NextResponse.json({
      success: true,
      message: "Successfully joined GP",
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
        members: gp.members,
        memberCount: gp.members.length,
        maxMembers: gp.maxMembers,
        createdBy: gp.createdBy,
        expiresAt: gp.expiresAt,
        status: gp.status,
      },
    });
  } catch (error: any) {
    console.error("GP Join Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


