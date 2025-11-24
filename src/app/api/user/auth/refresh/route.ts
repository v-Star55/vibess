// import connectDB from "@/src/app/config/dbconfig";
// import User from "@/src/models/userModel";
// import jwt from "jsonwebtoken";
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   let token = req.cookies.get("token")?.value;

//   if (!token) {
//     return NextResponse.json({ message: "No access token" }, { status: 401 });
//   }

//   try {
//     // ✅ Try to decode without verification first
//     const decoded = jwt.decode(token) as any;
    
//     if (!decoded || !decoded.id) {
//       return NextResponse.json({ message: "Invalid token" }, { status: 401 });
//     }

//     // ✅ Check if token is expired or still valid
//     try {
//       jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
//       // Token is still valid
//       return NextResponse.json({ message: "Access token valid" }, { status: 200 });
//     } catch (err: any) {
//       // Token is expired, proceed to refresh
//       if (err.name !== "TokenExpiredError") {
//         return NextResponse.json({ message: "Invalid access token" }, { status: 401 });
//       }
//     }

//     // ✅ Token expired - refresh it
//     await connectDB();
//     const user = await User.findById(decoded.id);

//     if (!user || !user.refreshToken) {
//       return NextResponse.json({ message: "No refresh token found" }, { status: 403 });
//     }

//     // ✅ Verify refresh token
//     jwt.verify(user.refreshToken, process.env.REFRESH_TOKEN_SECRET!);

//     // ✅ Generate new access token
//     const newAccessToken = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.ACCESS_TOKEN_SECRET!,
//       { expiresIn: "5m" }
//     );

//     const res = NextResponse.json(
//       { message: "New access token generated" },
//       { status: 200 }
//     );

//     res.cookies.set("token", newAccessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//     });

//     return res;

//   } catch (error: any) {
//     console.error("Refresh error:", error);
//     return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 403 });
//   }
// }


import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const refreshTokenCookie = req.cookies.get("refreshToken")?.value;
  const redirectAfterRefresh = req.cookies.get("redirectAfterRefresh")?.value;

  try {
    // Determine user identity from either access token (if present) or refresh token
    let userIdFromToken: string | null = null;
    if (token) {
      const decodedAccess: any = jwt.decode(token);
      if (decodedAccess && decodedAccess.id) {
        userIdFromToken = decodedAccess.id as string;
      }
    }

    await connectDB();
    let user = userIdFromToken ? await User.findById(userIdFromToken) : null;

    // Require refresh token cookie
    if (!refreshTokenCookie) {
      const res = NextResponse.json({ ok: false, message: "No refresh token found", reason: "missing_refresh_cookie" }, { status: 403 });
      res.cookies.delete("token");
      res.cookies.delete("refreshToken");
      res.cookies.delete("redirectAfterRefresh");
      return res;
    }

    // Verify and decode refresh token to get user id if needed
    let decodedRefresh: any;
    try {
      decodedRefresh = jwt.verify(refreshTokenCookie, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err: any) {
      const res = NextResponse.json({ ok: false, message: "Invalid or expired refresh token", reason: err?.name || "verify_failed" }, { status: 403 });
      res.cookies.delete("token");
      res.cookies.delete("refreshToken");
      res.cookies.delete("redirectAfterRefresh");
      return res;
    }

    if (!user) {
      if (!decodedRefresh || !decodedRefresh.id) {
        const res = NextResponse.json({ ok: false, message: "Unable to determine user from refresh token", reason: "missing_user_id" }, { status: 403 });
        res.cookies.delete("token");
        res.cookies.delete("refreshToken");
        res.cookies.delete("redirectAfterRefresh");
        return res;
      }
      user = await User.findById(decodedRefresh.id);
    }

    if (!user) {
      const res = NextResponse.json({ ok: false, message: "User not found", reason: "missing_user" }, { status: 404 });
      res.cookies.delete("token");
      res.cookies.delete("refreshToken");
      res.cookies.delete("redirectAfterRefresh");
      return res;
    }

    // Refresh token in cookie must match the DB-stored token
    if (!user.refreshToken || refreshTokenCookie !== user.refreshToken) {
      const res = NextResponse.json({ ok: false, message: "Refresh token mismatch", reason: "mismatch_refresh" }, { status: 403 });
      res.cookies.delete("token");
      res.cookies.delete("refreshToken");
      res.cookies.delete("redirectAfterRefresh");
      return res;
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );

    // Rotate refresh token
    const newRefreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );
    user.refreshToken = newRefreshToken;
    await user.save();

    // If middleware set a redirect path, redirect back to it; otherwise return JSON
    const response = redirectAfterRefresh
      ? NextResponse.redirect(new URL(redirectAfterRefresh, req.url))
      : NextResponse.json({ ok: true, message: "New access token generated" }, { status: 200 });
    response.cookies.set("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Clear redirect cookie if present
    if (redirectAfterRefresh) {
      response.cookies.delete("redirectAfterRefresh");
    }

    return response;
  } catch (error: any) {
    console.error("Refresh error:", error);
    const res = NextResponse.json({ ok: false, message: "Unexpected error refreshing token", reason: "unhandled_exception" }, { status: 500 });
    res.cookies.delete("token");
    res.cookies.delete("refreshToken");
    res.cookies.delete("redirectAfterRefresh");
    return res;
  }
}