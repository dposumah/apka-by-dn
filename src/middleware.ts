import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    // Daftar rute yang TIDAK BOLEH diakses oleh fasilitator
    const adminOnlyRoutes = [
      "/dashboard",
      "/dashboard-rab",
      "/pengeluaran",
      "/fasilitator",
      "/snt-akun"
    ]

    const isAdminRoute = adminOnlyRoutes.some(route => 
      pathname === route || pathname.startsWith(route + "/")
    )

    if (role === "FASILITATOR" && isAdminRoute) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - icon.png
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|icon.png|$).*)',
  ]
}
