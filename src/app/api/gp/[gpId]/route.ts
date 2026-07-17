import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";
import mongoose from "mongoose";

// Helper to sanitize anonymous messages
const sanitizeMessages = (messages: any[]) => {
  return (messages || []).map((m: any) => {
    if (m.isAnonymous) {
      return {
        _id: m._id,
        text: m.text,
        isAnonymous: true,
        readBy: m.readBy,
        sender: {
          _id: "anonymous",
          name: "Anonymous",
          username: "anonymous",
          profileImage: ""
        },
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      };
    }
    return m;
  });
};

// Get GP details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gpId: string }> }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { gpId } = await params;

    const gp = await Group.findById(gpId)
      .populate("createdBy", "name username profileImage")
      .populate("members", "name username profileImage")
      .populate("moderator", "name username profileImage")
      .populate("messages.sender", "name username profileImage")
      .populate("polls.createdBy", "name username profileImage");

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

    // Count user's anonymous messages sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const anonCountResult = await Group.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.sender": new mongoose.Types.ObjectId(user._id),
          "messages.isAnonymous": true,
          "messages.createdAt": { $gte: todayStart, $lte: todayEnd }
        }
      },
      { $count: "count" }
    ]);

    const anonCount = anonCountResult.length > 0 ? anonCountResult[0].count : 0;
    const anonRemaining = Math.max(0, 3 - anonCount);

    return NextResponse.json({
      success: true,
      anonRemaining,
      gp: {
        _id: gp._id,
        gpName: gp.gpName || "",
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
        messages: sanitizeMessages(gp.messages),
        polls: gp.polls || [],
        challenges: gp.challenges || [],
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

// Send message to GP
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gpId: string }> }
) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { gpId } = await params;
    const { text, isAnonymous } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { message: "Message text is required" },
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

    // Check if GP is active or permanent
    const now = new Date();
    const isGPActive = gp.status === "active" && gp.expiresAt > now;
    const isGPPermanent = gp.isPermanent && gp.status === "converted";
    
    if (!isGPActive && !isGPPermanent) {
      return NextResponse.json(
        { message: "This GP is no longer active" },
        { status: 400 }
      );
    }

    // Check daily limit of 3 anonymous messages
    if (isAnonymous) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const anonCountResult = await Group.aggregate([
        { $unwind: "$messages" },
        {
          $match: {
            "messages.sender": new mongoose.Types.ObjectId(user._id),
            "messages.isAnonymous": true,
            "messages.createdAt": { $gte: todayStart, $lte: todayEnd }
          }
        },
        { $count: "count" }
      ]);

      const anonCount = anonCountResult.length > 0 ? anonCountResult[0].count : 0;

      if (anonCount >= 3) {
        return NextResponse.json(
          { message: "You can only send 3 anonymous messages per day." },
          { status: 400 }
        );
      }
    }

    // Add message
    gp.messages.push({
      sender: user._id,
      text: text.trim(),
      readBy: [user._id],
      isAnonymous: isAnonymous || false,
    });

    // Update activity
    gp.lastActivityAt = now;
    gp.messageCount = gp.messages.length;
    if (!gp.firstMessageAt) {
      gp.firstMessageAt = now;
    }

    // Check if GP is now eligible for permanent conversion
    if (gp.checkPermanentEligibility() && !gp.isPermanentConversionEligible) {
      gp.isPermanentConversionEligible = true;
      gp.permanentConversionRequestedAt = now;
    }

    await gp.save();

    // Populate the updated GP
    const updatedGP = await Group.findById(gpId)
      .populate("createdBy", "name username profileImage")
      .populate("members", "name username profileImage")
      .populate("moderator", "name username profileImage")
      .populate("messages.sender", "name username profileImage")
      .populate("polls.createdBy", "name username profileImage");

    // Recalculate remaining anonymous count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const anonCountResult = await Group.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.sender": new mongoose.Types.ObjectId(user._id),
          "messages.isAnonymous": true,
          "messages.createdAt": { $gte: todayStart, $lte: todayEnd }
        }
      },
      { $count: "count" }
    ]);

    const postAnonCount = anonCountResult.length > 0 ? anonCountResult[0].count : 0;
    const anonRemaining = Math.max(0, 3 - postAnonCount);

    return NextResponse.json({
      success: true,
      anonRemaining,
      gp: {
        _id: updatedGP._id,
        gpName: updatedGP.gpName || "",
        category: updatedGP.category,
        subType: updatedGP.subType,
        specificName: updatedGP.specificName,
        genre: updatedGP.genre,
        talkTopics: updatedGP.talkTopics,
        description: updatedGP.description,
        creationReason: updatedGP.creationReason,
        reasonNote: updatedGP.reasonNote,
        location: {
          coordinates: updatedGP.location.coordinates,
          city: updatedGP.city,
          zone: updatedGP.zone,
        },
        members: updatedGP.members,
        memberCount: updatedGP.members.length,
        maxMembers: updatedGP.maxMembers,
        createdBy: updatedGP.createdBy,
        moderator: updatedGP.moderator,
        expiresAt: updatedGP.expiresAt,
        timeLeft: updatedGP.isPermanent
          ? null
          : Math.max(0, Math.floor((updatedGP.expiresAt.getTime() - now.getTime()) / (1000 * 60))),
        status: updatedGP.status,
        isPermanent: updatedGP.isPermanent,
        isPermanentConversionEligible: updatedGP.isPermanentConversionEligible,
        permanentConversionVotes: updatedGP.permanentConversionVotes,
        permanentConversionRequestedAt: updatedGP.permanentConversionRequestedAt,
        messageCount: updatedGP.messageCount,
        lastActivityAt: updatedGP.lastActivityAt,
        startedAt: updatedGP.startedAt,
        createdAt: updatedGP.createdAt,
        messages: sanitizeMessages(updatedGP.messages),
        polls: updatedGP.polls || [],
        challenges: updatedGP.challenges || [],
        isMember: true,
      },
    });
  } catch (error: any) {
    console.error("Send GP Message Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


