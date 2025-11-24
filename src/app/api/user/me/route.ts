import { NextRequest, NextResponse } from "next/server";
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

    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
