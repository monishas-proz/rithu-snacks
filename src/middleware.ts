import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

function getAccessTokenPayload(
  token?: string
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

    // Verify token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const nextAuthUser = req.auth?.user;

  // Check HttpOnly access_token cookie
  const accessTokenCookie = req.cookies.get("access_token")?.value;
  const tokenPayload = getAccessTokenPayload(accessTokenCookie);

  // User is authenticated if valid access_token cookie exists OR NextAuth session exists
  const isAuthenticated = !!tokenPayload || !!nextAuthUser;
  const userRole =
    tokenPayload?.role || (nextAuthUser as { role?: string })?.role;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (isAuthenticated && (userRole === "ADMIN" || userRole === "STAFF")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    if (userRole !== "ADMIN" && userRole !== "STAFF") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  const protectedCustomerRoutes = [
    "/cart",
    "/checkout",
    "/orders",
    "/profile",
    "/wishlist",
  ];
  const isProtectedCustomer = protectedCustomerRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedCustomer && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    if (userRole === "ADMIN" || userRole === "STAFF") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/cart",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/wishlist",
    "/login",
    "/register",
  ],
};
