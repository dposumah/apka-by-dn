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
      "/fasilitator"
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
    "/dashboard", "/dashboard/:path*",
    "/dashboard-rab", "/dashboard-rab/:path*", 
    "/pengeluaran", "/pengeluaran/:path*", 
    "/fasilitator", "/fasilitator/:path*", 
    "/portal", "/portal/:path*"
  ]
}
