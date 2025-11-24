import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import mongoose from "mongoose";
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

    // 🧾 Parse JSON body
    const body = await req.json();
    const { readyToListen } = body;

    console.log("Received request body:", body);
    console.log("readyToListen value:", readyToListen, "type:", typeof readyToListen);

    if (typeof readyToListen !== "boolean") {
      return NextResponse.json(
        { error: "readyToListen must be a boolean" },
        { status: 400 }
      );
    }

    console.log(`Updating readyToListen for user ${userId} to ${readyToListen}`);
    
    // Check if user exists first
    const existingUser = await User.findById(userId);
    console.log("Existing user readyToListen value:", existingUser?.readyToListen);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🧠 Use MongoDB native collection to bypass Mongoose schema issues
    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');
    
    if (!usersCollection) {
      throw new Error("Database collection not found");
    }

    // Update using native MongoDB driver
    const objectId = new mongoose.Types.ObjectId(userId);
    const updateResult = await usersCollection.updateOne(
      { _id: objectId },
      { $set: { readyToListen: Boolean(readyToListen) } }
    );


    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch using native MongoDB to verify
    const rawDoc = await usersCollection.findOne({ _id: objectId });


    // Also fetch using Mongoose to see if it includes the field
    const mongooseUser = await User.findById(userId).select("-password -refreshToken");
    const leanUser = await User.findById(userId).lean() as any;
    
   

    // Use the raw document value if Mongoose doesn't return it
    const finalValue = leanUser?.readyToListen ?? rawDoc?.readyToListen ?? Boolean(readyToListen);

    // Ensure the Mongoose user object has the field
    const responseUser = mongooseUser ? { ...mongooseUser.toObject(), readyToListen: finalValue } : leanUser || {};
    
    return NextResponse.json({
      success: true,
      message: "Ready to listen status updated successfully",
      user: responseUser,
      readyToListen: finalValue,
    });
  } catch (error: any) {
    console.error("Error updating ready to listen:", error);
    return NextResponse.json(
      { error: "Failed to update ready to listen status", details: error.message },
      { status: 500 }
    );
  }
}

