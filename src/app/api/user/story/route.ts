import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Story from "@/src/models/storyModel";
import { uploadToCloudinary } from "@/src/app/lib/uploadToCloudinary";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const userId = decoded.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

    const isVideo = file.type.startsWith("video/");
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadToCloudinary(buffer, "stories", isVideo ? "video" : "image");

    const newStory = await Story.create({
      user: userId,
      media: { url: upload.url, type: isVideo ? "video" : "image", publicId: upload.publicId },
      caption,
    });

    return NextResponse.json({ success: true, story: newStory });
  } catch (error: any) {
    console.error("Error uploading story:", error);
    return NextResponse.json({ error: "Failed to upload story", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const stories = await Story.find()
      .populate("user", "name username profileImage")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, stories });
  } catch (error: any) {
    console.error("Error fetching stories:", error);
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}
