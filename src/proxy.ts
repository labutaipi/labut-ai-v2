import { NextRequest, NextResponse } from 'next/server'
import { getSessionInMiddleware } from '@/lib/auth-middleware'

const PROTECTED = ['/dashboard', '/onboarding']
const AUTH_PAGES = ['/sign-in', '/sign-up']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))

  if (!isProtected && !isAuthPage) return NextResponse.next()

  const session = await getSessionInMiddleware(request)

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding', '/sign-in', '/sign-up'],
}
