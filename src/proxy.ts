import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgotpassword") ||
    pathname.startsWith("/resetpassword") ||
    pathname.startsWith("/verifyemail") ||
    pathname === "/landing";

  // ✅ If user is logged in and tries to visit an auth page
  if (token && isAuthPage) {
    try {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return NextResponse.redirect(new URL("/app-home", request.url));
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        // ✅ Token expired - redirect to refresh endpoint which will handle it
        return NextResponse.redirect(new URL("/api/user/auth/refresh", request.url));
      }
      // Invalid token - let them access auth pages
      return NextResponse.next();
    }
  }

  // ✅ No access token
  if (!token) {
    // If refresh token exists, redirect to refresh flow and come back to original path
    if (refreshToken) {
      const response = NextResponse.redirect(
        new URL("/api/user/auth/refresh", request.url)
      );
      response.cookies.set("redirectAfterRefresh", pathname || "/", {
        httpOnly: true,
        maxAge: 60,
      });
      return response;
    }
    // No refresh token either → allow auth pages, otherwise go to landing
    if (!isAuthPage) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }
    return NextResponse.next();
  }

  // ✅ Has token and accessing protected page - verify it
  if (token && !isAuthPage) {
    try {
      // If token is about to expire soon, proactively refresh
      const decoded: any = jwt.decode(token);
      if (decoded?.exp) {
        const expiresAtMs = decoded.exp * 1000;
        const timeLeftMs = expiresAtMs - Date.now();
        const thresholdMs = 2 * 60 * 1000; // 2 minutes
        if (timeLeftMs <= thresholdMs && refreshToken) {
          const response = NextResponse.redirect(
            new URL("/api/user/auth/refresh", request.url)
          );
          response.cookies.set("redirectAfterRefresh", pathname, {
            httpOnly: true,
            maxAge: 60,
          });
          return response;
        }
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return NextResponse.next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        // ✅ Redirect to refresh endpoint to get new token
        const response = NextResponse.redirect(
          new URL("/api/user/auth/refresh", request.url)
        );
        // Store the original URL to redirect back after refresh
        response.cookies.set("redirectAfterRefresh", pathname, {
          httpOnly: true,
          maxAge: 60, // 1 minute
        });
        return response;
      }
      // Invalid token - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};