import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import UserProfileDetail from "@/src/models/userProfileDetailModel";
import jwt from "jsonwebtoken";
import getOrCreateProfileDetails from "@/src/app/helpers/getOrCreateProfileDetails";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 🔐 Get JWT from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || decoded.id;

    // Fetch ProfileDetails
    const profileDetails = await getOrCreateProfileDetails(userId);

    return NextResponse.json({
      success: true,
      profileDetails,
    });
  } catch (error: any) {
    console.error("Error fetching profile details:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile details", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // 🔐 Get JWT from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.id;
    const body = await req.json();

    // 🧠 Update UserProfileDetail
    const updatedDetails = await UserProfileDetail.findOneAndUpdate(
      { user: userId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedDetails) {
      return NextResponse.json({ error: "Profile details not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile details updated successfully",
      profileDetails: updatedDetails,
    });
  } catch (error: any) {
    console.error("Error updating profile details:", error);
    return NextResponse.json(
      { error: "Failed to update profile details", details: error.message },
      { status: 500 }
    );
  }
}
