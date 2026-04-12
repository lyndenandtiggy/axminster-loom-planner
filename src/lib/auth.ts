import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionUser = 'arthur' | 'axminster' | 'parent';

const COOKIE_NAME = 'session';
const JWT_EXPIRY = '24h';

function jwtSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(s);
}

// ---------------------------------------------------------------------------
// Password / PIN utilities
// ---------------------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(jwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ user: SessionUser } | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (typeof payload.user !== 'string') return null;
    return { user: payload.user as SessionUser };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Server-component helper (reads from the incoming request cookies)
// ---------------------------------------------------------------------------

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ---------------------------------------------------------------------------
// Cookie shape (used by the API route via NextResponse)
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  },
} as const;
