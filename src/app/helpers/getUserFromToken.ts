import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";

export default async function getUserFromToken(req: NextRequest) {
  try {
    await connectDB();

    // read token from cookies (same as your GET route)
    const token = req.cookies.get("token")?.value;
    if (!token) return null;

    // verify token and decode user ID
    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);

    // fetch user without password
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return null;

    return user;
  } catch (err) {
    return null;
  }
}
