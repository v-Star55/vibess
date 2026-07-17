import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Helper to get challenges
async function getChallenges(gpId: string) {
  const gp = await Group.findById(gpId);
  return gp ? gp.challenges : [];
}

// Create a Challenge
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
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ message: "Challenge text is required" }, { status: 400 });
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json({ message: "GP not found" }, { status: 404 });
    }

    gp.challenges.push({
      user: user.name || user.username,
      userId: user._id,
      text: text.trim(),
      completedBy: []
    });

    await gp.save();

    const challenges = await getChallenges(gpId);
    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error("Create Challenge Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// Toggle Complete Challenge
export async function PUT(
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
    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ message: "Challenge ID is required" }, { status: 400 });
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json({ message: "GP not found" }, { status: 404 });
    }

    const challenge = gp.challenges.id(challengeId);
    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 });
    }

    const completedByStr = challenge.completedBy.map((id: any) => id.toString());
    if (completedByStr.includes(user._id.toString())) {
      challenge.completedBy = challenge.completedBy.filter((id: any) => id.toString() !== user._id.toString());
    } else {
      challenge.completedBy.push(user._id);
    }

    await gp.save();

    const challenges = await getChallenges(gpId);
    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error("Toggle Challenge Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// Delete a Challenge
export async function DELETE(
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
    const url = new URL(req.url);
    const challengeId = url.searchParams.get("challengeId");

    if (!challengeId) {
      return NextResponse.json({ message: "Challenge ID is required" }, { status: 400 });
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json({ message: "GP not found" }, { status: 404 });
    }

    const challenge = gp.challenges.id(challengeId);
    if (!challenge) {
      return NextResponse.json({ message: "Challenge not found" }, { status: 404 });
    }

    // Check permissions
    const isChalCreator = challenge.userId.toString() === user._id.toString();
    const isGPCreator = gp.createdBy.toString() === user._id.toString();
    const isGPMod = gp.moderator && gp.moderator.toString() === user._id.toString();

    if (!isChalCreator && !isGPCreator && !isGPMod) {
      return NextResponse.json({ message: "You are not authorized to delete this challenge" }, { status: 403 });
    }

    gp.challenges.pull(challengeId);
    await gp.save();

    const challenges = await getChallenges(gpId);
    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error("Delete Challenge Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
