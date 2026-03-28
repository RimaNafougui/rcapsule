import { NextResponse } from "next/server";

import { auth } from "@/auth";

const protectedRoutes = [
  "/profile",
  "/closet",
  "/settings",
  "/outfits",
  "/wishlist",
  "/calendar",
  "/collections",
];

const guestRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/update-password",
];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (isLoggedIn && guestRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/closet", req.url));
  }

  if (!isLoggedIn && protectedRoutes.some((r) => pathname.startsWith(r))) {
    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/profile/:path*",
    "/closet/:path*",
    "/settings/:path*",
    "/outfits/:path*",
    "/wishlist/:path*",
    "/calendar/:path*",

    "/login",
    "/signup",
    "/forgot-password",
    "/update-password",
  ],
};
