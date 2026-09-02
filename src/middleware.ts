import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    if (role === "FASILITATOR" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/portal", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/portal", "/portal/:path*"]
}
