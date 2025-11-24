import connectDB from '@/src/app/config/dbconfig';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/src/app/helpers/sendEmail';
import User from '@/src/models/userModel';

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password } = await req.json();
    await connectDB();

    let user = await User.findOne({ email });

    // ✅ Generate OTP and expiry (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Case 1: User exists and verified
    if (user && user.isVerified) {
      return NextResponse.json({
        message: 'User already verified — please log in',
        data: {
          name: user.name,
          email: user.email,
          username: user.username,
        },
        verified: true,
      });
    }

    // Case 2: User exists but not verified
    if (user && !user.isVerified) {
      user.otp = otp;
      user.otpExpires = otpExpires;

      try {
        await user.save();
        await sendVerificationEmail(user.email, user.name, otp);
        console.log(`📧 OTP resent to ${user.email}`);

        return NextResponse.json({
          message: 'OTP resent for email verification',
          data: {
            name: user.name,
            email: user.email,
            username: user.username,
          },
          verified: false,
        });
      } catch (err) {
        console.error('❌ Error sending OTP email:', err);
        return NextResponse.json(
          { error: 'Failed to resend OTP email' },
          { status: 500 }
        );
      }
    }

    // Case 3: New user registration
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    user = new User({
      name,
      username,
      email,
      password: hashPass,
      otp,
      otpExpires,
      isVerified: false,
    });

    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, otp);
      console.log(`📧 OTP sent to new user ${user.email}`);
    } catch (err) {
      console.error('❌ Error sending email:', err);
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User registered and OTP sent for verification',
      data: {
        name: user.name,
        email: user.email,
        username: user.username,
      },
      verified: false,
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
