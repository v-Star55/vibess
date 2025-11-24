import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import { sendVerificationEmail } from "@/src/app/helpers/sendEmail";


export async function POST(request: NextRequest) {
    try {
        const { identifier, password } = await request.json();
        if (!identifier || !password) {
            return NextResponse.json({ message: "Email/username and password are required" }, { status: 400 });
        }
        await connectDB();

        const loginId = identifier.trim();
        const query = loginId.includes("@")
            ? { email: loginId.toLowerCase() }
            : { username: loginId.toLowerCase() };

        const user = await User.findOne(query);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // ✅ If not verified, resend OTP and ask to verify
        if (!user.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            try {
                await sendVerificationEmail(user.email, user.name, otp);
            } catch (err) {
                console.error("❌ Failed to send OTP:", err);
            }

            return NextResponse.json(
                { message: "Email not verified. OTP resent for verification.", email: user.email },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // token generation

        const accessToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "15m" } // 15 min validity
        );

        /// refresh Token (longer expiry)

        const refreshToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: "7d" }
        );

        /// saving referesh token in db
        user.refreshToken = refreshToken;
        await user.save();
        
        const res = NextResponse.json(
            {
                message: "Login successful",
                user: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified,
                    isAdmin: user.isAdmin,
                    profileImage: user.profileImage,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
            { status: 200 }
        );

        res.cookies.set("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15, // 15 minutes
        });

        // Also set refresh token as httpOnly cookie for reliable refresh
        res.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;



    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }

}
