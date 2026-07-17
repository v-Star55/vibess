import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Helper to get fully populated polls
async function getPopulatedPolls(gpId: string) {
  const gp = await Group.findById(gpId)
    .populate("polls.createdBy", "name username profileImage");
  return gp ? gp.polls : [];
}

// Create a Poll
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
    const { question, options } = await req.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ message: "Question is required" }, { status: 400 });
    }
    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ message: "At least 2 options are required" }, { status: 400 });
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json({ message: "GP not found" }, { status: 404 });
    }

    const formattedOptions = options.map((opt: string) => ({
      text: opt.trim(),
      votes: 0,
      voters: []
    }));

    gp.polls.push({
      question: question.trim(),
      options: formattedOptions,
      createdBy: user._id
    });

    await gp.save();

    const polls = await getPopulatedPolls(gpId);
    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error("Create Poll Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// Vote in a Poll
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
    const { pollId, optionIdx } = await req.json();

    if (!pollId || optionIdx === undefined) {
      return NextResponse.json({ message: "Poll ID and Option Index are required" }, { status: 400 });
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json({ message: "GP not found" }, { status: 404 });
    }

    const poll = gp.polls.id(pollId);
    if (!poll) {
      return NextResponse.json({ message: "Poll not found" }, { status: 404 });
    }

    // Toggle vote
    poll.options.forEach((opt: any, idx: number) => {
      const votersStr = opt.voters.map((v: any) => v.toString());
      const hasVotedThis = votersStr.includes(user._id.toString());

      if (idx === optionIdx) {
        if (hasVotedThis) {
          opt.voters = opt.voters.filter((v: any) => v.toString() !== user._id.toString());
        } else {
          opt.voters.push(user._id);
        }
      } else {
        opt.voters = opt.voters.filter((v: any) => v.toString() !== user._id.toString());
      }
      opt.votes = opt.voters.length;
    });

    await gp.save();

    const polls = await getPopulatedPolls(gpId);
    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error("Vote Poll Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// Delete a Poll
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
    const pollId = url.searchParams.get("pollId");

    if (!pollId) {
      return NextResponse.json({ message: "Poll ID is required" }, { status: 400 });
    }

    const gp = await Group.findById(gpId);
    if (!gp) {
      return NextResponse.json({ message: "GP not found" }, { status: 404 });
    }

    const poll = gp.polls.id(pollId);
    if (!poll) {
      return NextResponse.json({ message: "Poll not found" }, { status: 404 });
    }

    // Check permissions
    const isPollCreator = poll.createdBy.toString() === user._id.toString();
    const isGPCreator = gp.createdBy.toString() === user._id.toString();
    const isGPMod = gp.moderator && gp.moderator.toString() === user._id.toString();

    if (!isPollCreator && !isGPCreator && !isGPMod) {
      return NextResponse.json({ message: "You are not authorized to delete this poll" }, { status: 403 });
    }

    gp.polls.pull(pollId);
    await gp.save();

    const polls = await getPopulatedPolls(gpId);
    return NextResponse.json({ success: true, polls });
  } catch (error: any) {
    console.error("Delete Poll Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
