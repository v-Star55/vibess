import connectDB from '@/src/app/config/dbconfig';
import User from '@/src/models/userModel';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    await connectDB();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required." },
        { status: 400 }
      );
    }

   
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Check OTP match and expiry
    if (user.otp !== Number(otp)) {
      return NextResponse.json(
        { message: "Invalid OTP." },
        { status: 400 }
      );
    }

    if (user.otpExpires && user.otpExpires.getTime() < Date.now()) {
      return NextResponse.json(
        { message: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark user as verified and clear OTP fields
    user.otp = undefined as any;
    user.otpExpires = undefined as any;
    user.isVerified = true;
    await user.save();

    return NextResponse.json({
      message: "User verified successfully ✅",
      data: { email: user.email },
      verified:true
    });

  } catch (error) {
    console.error("Error in OTP route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
