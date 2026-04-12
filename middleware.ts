import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'session';

function jwtSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(s);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Verify the JWT (runs in Edge — no Node.js APIs allowed here)
  let user: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, jwtSecret());
      if (typeof payload.user === 'string') user = payload.user;
    } catch {
      // expired or tampered — treat as unauthenticated
    }
  }

  // /parent is restricted to the parent account
  if (pathname.startsWith('/parent')) {
    if (user !== 'parent') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // /studio requires any authenticated session
  if (pathname.startsWith('/studio')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/parent/:path*'],
};
