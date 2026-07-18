import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Safe JWT decode helper for Edge runtime
function decodeJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Helper to copy Set-Cookie headers from fetch response to NextResponse
function copyCookies(fromResponse: Response, toResponse: NextResponse) {
  const setCookieHeaders = (fromResponse.headers as any).getSetCookie();
  if (setCookieHeaders && Array.isArray(setCookieHeaders)) {
    for (const cookieStr of setCookieHeaders) {
      toResponse.headers.append("set-cookie", cookieStr);
    }
  }
}

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
    pathname === "/landing" ||
    pathname === "/";

  // Define redirect targets
  const loginRedirect = NextResponse.redirect(new URL("/landing", request.url));
  const appHomeRedirect = NextResponse.redirect(new URL("/app-home", request.url));

  // Helper to handle background token refresh
  const refreshSession = async () => {
    try {
      const refreshRes = await fetch(new URL("/api/user/auth/refresh", request.url), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (refreshRes.ok) {
        return { success: true, response: refreshRes };
      }
    } catch (err) {
      console.error("Middleware background refresh failed:", err);
    }
    return { success: false };
  };

  // Case 1: User is logged in (has valid access token) and tries to visit an auth page
  if (token && isAuthPage) {
    let isExpired = true;
    try {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp) {
        isExpired = decoded.exp * 1000 < Date.now();
      }
    } catch (err) {
      console.error("Failed to decode token", err);
    }

    if (!isExpired) {
      // Access token is valid, redirect to app home
      return appHomeRedirect;
    } else if (refreshToken) {
      // Access token is expired, try to refresh in background
      const refresh = await refreshSession();
      if (refresh.success && refresh.response) {
        const response = NextResponse.redirect(new URL("/app-home", request.url));
        copyCookies(refresh.response, response);
        return response;
      }
    }
    // If refresh fails or token is invalid, let them access auth page
    return NextResponse.next();
  }

  // Case 2: No access token
  if (!token) {
    if (refreshToken) {
      // Access token is missing but refresh token exists, try to refresh in background
      const refresh = await refreshSession();
      if (refresh.success && refresh.response) {
        const response = isAuthPage ? appHomeRedirect : NextResponse.next();
        copyCookies(refresh.response, response);
        return response;
      }
    }
    // No access token and refresh failed/missing
    if (!isAuthPage) {
      // Accessing protected page → redirect to landing
      return loginRedirect;
    }
    return NextResponse.next();
  }

  // Case 3: Has token and accessing protected page
  if (token && !isAuthPage) {
    let isExpired = true;
    let isAboutToExpire = false;

    try {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp) {
        const expiresAtMs = decoded.exp * 1000;
        const timeLeftMs = expiresAtMs - Date.now();
        isExpired = timeLeftMs <= 0;
        const thresholdMs = 2 * 60 * 1000; // 2 minutes
        isAboutToExpire = timeLeftMs > 0 && timeLeftMs <= thresholdMs;
      }
    } catch (err) {
      console.error("Failed to decode token in Case 3", err);
    }

    if (isExpired || isAboutToExpire) {
      if (refreshToken) {
        const refresh = await refreshSession();
        if (refresh.success && refresh.response) {
          const response = NextResponse.next();
          copyCookies(refresh.response, response);
          return response;
        }
      }

      if (isExpired) {
        // Access token is expired and refresh failed/missing -> redirect to landing
        return loginRedirect;
      }
    }

    // Token is valid and not about to expire (or refresh failed but token is not expired yet)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
