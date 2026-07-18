import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import { uploadToCloudinary } from "@/src/app/lib/uploadToCloudinary";
import jwt from "jsonwebtoken";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // 🔐 Get JWT from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const userId = decoded.id;

    // 🧾 Parse form data
    const formData = await req.formData();
    const bio = formData.get("bio") as string | null;
    const birthday = formData.get("birthday") as string | null;
    const profileFile = formData.get("profileImage") as File | null;
    const bannerFile = formData.get("bannerImage") as File | null;
    const appearInHeatmapStr = formData.get("appearInHeatmap") as string | null;
    const showExactDistanceStr = formData.get("showExactDistance") as string | null;

    // 🖼️ Upload to Cloudinary if provided
    const updates: Record<string, any> = {};

    if (bio !== undefined && bio !== null) {
      updates.bio = bio.trim();
    }

    if (birthday !== undefined && birthday !== null) {
      updates.birthday = birthday ? new Date(birthday) : null;
    }

    if (appearInHeatmapStr !== null) {
      updates.appearInHeatmap = appearInHeatmapStr === "true";
    }

    if (showExactDistanceStr !== null) {
      updates.showExactDistance = showExactDistanceStr === "true";
    }

    if (profileFile && profileFile.size > 0) {
      const bytes = await profileFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await uploadToCloudinary(buffer, "users/profile", "image");
      updates.profileImage = result.url;
    }

    if (bannerFile && bannerFile.size > 0) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await uploadToCloudinary(buffer, "users/banner", "image");
      updates.bannerImage = result.url;
    }

    // 🧠 Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}
