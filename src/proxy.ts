import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (/^\/google[\w-]+\.html$/i.test(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = `/api/seo/verify${pathname}`
    return NextResponse.rewrite(url)
  }

  // Check if the request is for an admin route
  if (pathname.startsWith('/admin')) {
    const hasAdminSession = request.cookies.get('admin_session')?.value === '1'
    if (!hasAdminSession) {
      const home = new URL('/', request.url)
      return NextResponse.redirect(home)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
