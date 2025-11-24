import { NextRequest, NextResponse } from 'next/server';
import jwt from "jsonwebtoken";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "No token" }, { status: 401 });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const followers = user.followers.length;
    const following = user.following.length;

    const profile = {
      user,
      followers,
      following,
    };

    return NextResponse.json({ message: "Profile fetched successfully", profile }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
