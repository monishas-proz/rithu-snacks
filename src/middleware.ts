import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (session?.user) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (!session?.user) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const protectedCustomerRoutes = ["/cart", "/checkout", "/orders", "/profile", "/wishlist"];
  const isProtectedCustomer = protectedCustomerRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedCustomer && !session?.user) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  if (pathname === "/login" && session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname === "/register" && session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout/:path*", "/orders/:path*", "/profile/:path*", "/wishlist", "/login", "/register"],
};
