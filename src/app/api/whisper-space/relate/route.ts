import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Confession from "@/src/models/confessionModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { confessionId } = await req.json();
    if (!confessionId) {
      return NextResponse.json(
        { message: "Confession ID is required" },
        { status: 400 }
      );
    }

    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return NextResponse.json(
        { message: "Confession not found" },
        { status: 404 }
      );
    }

    if (confession.status !== "active") {
      return NextResponse.json(
        { message: "Confession is no longer active" },
        { status: 400 }
      );
    }

    // Check if user already related to this confession
    const relateIndex = confession.relates.findIndex(
      (id: any) => id && id.toString() === user._id.toString()
    );
    let hasRelated = false;

    if (relateIndex > -1) {
      // User already related, so remove them
      confession.relates.splice(relateIndex, 1);
    } else {
      // User hasn't related, so add them
      confession.relates.push(user._id);
      hasRelated = true;
    }

    // Update count
    confession.relateCount = confession.relates.length;
    await confession.save();

    return NextResponse.json({
      success: true,
      relatesCount: confession.relateCount,
      hasRelated,
    });
  } catch (error: any) {
    console.error("Relate Confession Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
