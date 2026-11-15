import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const FASILITATOR_ALLOWED_PREFIXES = ["/portal", "/api/auth", "/api/upload", "/b/"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    if (req.nextauth.token?.isActive === false) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (role === "FASILITATOR") {
      const isAllowed = FASILITATOR_ALLOWED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith("/b/")
      );
      if (!isAllowed) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/portal", req.url));
      }
    }

    if (role === "VIEWER" && pathname.startsWith("/pengaturan/pengguna")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (role === "KORWIL" && pathname.startsWith("/pengaturan/pengguna")) {
      return NextResponse.redirect(new URL("/dashboard-rab", req.url));
    }
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => !!token && token.isActive !== false,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth)
     * - b/ (Signed receipt proxy links)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - icon.png
     */
    "/((?!api/auth|b/|_next/static|_next/image|favicon.ico|login|icon.png|$).*)",
  ],
};
