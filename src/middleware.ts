import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Jika Fasilitator mencoba mengakses dashboard akuntansi, redirect ke portal
  if (token && token.role === 'FASILITATOR' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/portal', req.url))
  }

  // Jika bukan Fasilitator mencoba mengakses portal, biarkan atau redirect ke dashboard
  if (token && token.role !== 'FASILITATOR' && pathname === '/portal') {
    // Admin boleh lihat portal? Bebas, sementara biarkan saja.
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*']
}
