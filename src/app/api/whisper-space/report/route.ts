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

    // Check if user already reported
    if (confession.hasUserReported(user._id)) {
      return NextResponse.json(
        { message: "You have already reported this confession" },
        { status: 400 }
      );
    }

    // Add report
    confession.reports.push({
      user: user._id,
      reportedAt: new Date(),
    });
    confession.reportCount = confession.reports.length;

    // If 3 or more reports, remove it
    if (confession.reportCount >= 3) {
      confession.status = "removed";
      confession.removedAt = new Date();
      confession.removedReason = "reported";
    }

    await confession.save();

    return NextResponse.json({
      success: true,
      message:
        confession.reportCount >= 3
          ? "Confession removed due to reports"
          : "Report submitted",
      removed: confession.reportCount >= 3,
    });
  } catch (error: any) {
    console.error("Report Confession Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

