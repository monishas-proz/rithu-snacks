import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

function parseJwtPayload(
  token?: string,
  checkExp: boolean = true
): { role?: string; userId?: string; email?: string; exp?: number } | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Edge-safe base64url decoding
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    // Verify token expiration if requested
    if (checkExp && payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const nextAuthUser = req.auth?.user;

  // Check HttpOnly access_token cookie
  const accessTokenCookie = req.cookies.get("access_token")?.value;
  let validAccessToken = parseJwtPayload(accessTokenCookie, true);
  let rawAccessToken = parseJwtPayload(accessTokenCookie, false);

  // Check HttpOnly refresh_token cookie
  const refreshTokenCookie = req.cookies.get("refresh_token")?.value;
  const validRefreshToken = parseJwtPayload(refreshTokenCookie, true);

  let newSetCookieHeaders: string[] = [];

  // If access token is expired or missing, but refresh token is valid, perform silent refresh at Edge
  if (!validAccessToken && validRefreshToken) {
    try {
      const refreshUrl = new URL("/api/auth/refresh", req.url);
      const refreshRes = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          cookie: req.headers.get("cookie") || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (refreshRes.ok) {
        // Collect Set-Cookie headers from refresh response
        const getSetCookie = (
          refreshRes.headers as unknown as { getSetCookie?: () => string[] }
        ).getSetCookie;
        if (typeof getSetCookie === "function") {
          newSetCookieHeaders = getSetCookie.call(refreshRes.headers);
        } else {
          const sc = refreshRes.headers.get("set-cookie");
          if (sc) newSetCookieHeaders = [sc];
        }

        // Extract and decode new access_token from Set-Cookie
        for (const cookieStr of newSetCookieHeaders) {
          const match = cookieStr.match(/access_token=([^;]+)/);
          if (match) {
            const tokenVal = decodeURIComponent(match[1]);
            validAccessToken = parseJwtPayload(tokenVal, true);
            rawAccessToken = parseJwtPayload(tokenVal, false);
            break;
          }
        }
      }
    } catch {
      // Ignore refresh network error; will fall through to auth check
    }
  }

  // User is authenticated if valid access_token, valid refresh_token, OR NextAuth session exists
  const isAuthenticated =
    !!validAccessToken || !!validRefreshToken || !!nextAuthUser;

  const userRole =
    validAccessToken?.role ||
    rawAccessToken?.role ||
    (nextAuthUser as { role?: string })?.role;

  const applyCookies = (res: NextResponse) => {
    if (newSetCookieHeaders.length > 0) {
      newSetCookieHeaders.forEach((c) => {
        res.headers.append("set-cookie", c);
      });
    }
    return res;
  };

  if (pathname.startsWith("/admin")) {
    // /admin or /admin/ direct navigation
    if (pathname === "/admin" || pathname === "/admin/") {
      const url = req.nextUrl.clone();
      if (isAuthenticated && (userRole === "ADMIN" || userRole === "STAFF")) {
        url.pathname = "/admin/dashboard";
      } else {
        url.pathname = "/admin/login";
      }
      url.search = "";
      return applyCookies(NextResponse.redirect(url));
    }

    if (pathname === "/admin/login") {
      if (isAuthenticated && (userRole === "ADMIN" || userRole === "STAFF")) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        url.search = "";
        return applyCookies(NextResponse.redirect(url));
      }
      return applyCookies(NextResponse.next());
    }

    if (!isAuthenticated || (userRole !== "ADMIN" && userRole !== "STAFF")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return applyCookies(NextResponse.redirect(url));
    }

    return applyCookies(NextResponse.next());
  }

  const protectedCustomerRoutes = [
    "/cart",
    "/checkout",
    "/orders",
    "/profile",
    "/wishlist",
  ];
  const isProtectedCustomer = protectedCustomerRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedCustomer && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return applyCookies(NextResponse.redirect(url));
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.search = "";
    if (userRole === "ADMIN" || userRole === "STAFF") {
      url.pathname = "/admin/dashboard";
    } else {
      url.pathname = "/";
    }
    return applyCookies(NextResponse.redirect(url));
  }

  return applyCookies(NextResponse.next());
});

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/cart",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile",
    "/profile/:path*",
    "/wishlist",
    "/login",
    "/register",
  ],
};
