import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import Chat from "@/src/models/chatModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Check and mark eligible GPs for permanent conversion
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { gpId, action } = await req.json();

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

    // Check if user is a member
    const isMember = gp.members.some(
      (member: any) => member._id.toString() === user._id.toString()
    );
    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this GP" },
        { status: 403 }
      );
    }

    // Action: "check" - check eligibility and request conversion
    // Action: "vote" - vote on conversion (requires vote: "yes" or "no")
    if (action === "check") {
      // Check if eligible
      if (!gp.checkPermanentEligibility()) {
        return NextResponse.json(
          { message: "This GP is not eligible for permanent conversion yet" },
          { status: 400 }
        );
      }

      // Mark as eligible and request conversion
      gp.isPermanentConversionEligible = true;
      gp.permanentConversionRequestedAt = new Date();
      await gp.save();

      return NextResponse.json({
        success: true,
        message: "GP is now eligible for permanent conversion. Members can vote.",
        gp: {
          _id: gp._id,
          isPermanentConversionEligible: gp.isPermanentConversionEligible,
          permanentConversionRequestedAt: gp.permanentConversionRequestedAt,
        },
      });
    } else if (action === "vote") {
      const { vote } = await req.json();

      if (!vote || !["yes", "no"].includes(vote)) {
        return NextResponse.json(
          { message: "Vote must be 'yes' or 'no'" },
          { status: 400 }
        );
      }

      if (!gp.isPermanentConversionEligible) {
        return NextResponse.json(
          { message: "This GP is not eligible for permanent conversion" },
          { status: 400 }
        );
      }

      // Check if user already voted
      const existingVote = gp.permanentConversionVotes.find(
        (v: any) => v.user.toString() === user._id.toString()
      );

      if (existingVote) {
        // Update existing vote
        existingVote.vote = vote;
        existingVote.votedAt = new Date();
      } else {
        // Add new vote
        gp.permanentConversionVotes.push({
          user: user._id,
          vote,
          votedAt: new Date(),
        });
      }

      await gp.save();

      // Check if conversion is approved (70% yes votes)
      const result = gp.getPermanentConversionResult();
      if (result && result.approved) {
        // Convert to permanent chat
        await convertToPermanentChat(gp);
      }

      return NextResponse.json({
        success: true,
        message: "Vote recorded",
        voteResult: gp.getPermanentConversionResult(),
        converted: result?.approved || false,
      });
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'check' or 'vote'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Permanent Conversion Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper function to convert GP to permanent chat
async function convertToPermanentChat(gp: any) {
  try {
    // Create permanent chat
    const chat = new Chat({
      participants: gp.members.map((m: any) => m._id || m),
      messages: [],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isLocked: false,
      isPermanentlyUnlocked: true,
      matchedAt: gp.startedAt,
    });

    await chat.save();

    // Update GP status
    gp.status = "converted";
    gp.isPermanent = true;
    gp.convertedToChatAt = new Date();

    // Set moderator (first active member after creator)
    const creatorId = gp.createdBy.toString();
    const otherMembers = gp.members.filter(
      (m: any) => (m._id || m).toString() !== creatorId
    );
    if (otherMembers.length > 0) {
      gp.moderator = otherMembers[0]._id || otherMembers[0];
    }

    await gp.save();

    return chat;
  } catch (error) {
    console.error("Error converting GP to permanent chat:", error);
    throw error;
  }
}

// GET endpoint to check conversion status
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gpId = searchParams.get("gpId");

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

    const isEligible = gp.checkPermanentEligibility();
    const voteResult = gp.getPermanentConversionResult();

    // Check if user has voted
    const userVote = gp.permanentConversionVotes.find(
      (v: any) => v.user.toString() === user._id.toString()
    );

    return NextResponse.json({
      success: true,
      isEligible,
      isConversionEligible: gp.isPermanentConversionEligible,
      voteResult,
      userVote: userVote ? userVote.vote : null,
      isPermanent: gp.isPermanent,
    });
  } catch (error: any) {
    console.error("Get Conversion Status Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}


