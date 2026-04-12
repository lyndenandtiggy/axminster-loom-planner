import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  type SessionUser,
} from '@/lib/auth';

const MODE_TO_ENV: Record<string, string> = {
  arthur: 'ARTHUR_PASSWORD_HASH',
  axminster: 'AXMINSTER_PASSWORD_HASH',
  parent: 'JOSH_PIN_HASH',
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { password, mode } = body as { password?: string; mode?: string };

  if (!password || !mode) {
    return NextResponse.json(
      { error: 'Missing password or mode' },
      { status: 400 }
    );
  }

  if (!(mode in MODE_TO_ENV)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  const hash = process.env[MODE_TO_ENV[mode]];
  if (!hash) {
    return NextResponse.json(
      { error: 'Server not configured' },
      { status: 500 }
    );
  }

  const valid = await verifyPassword(password, hash);
  if (!valid) {
    // Uniform message to avoid user enumeration
    return NextResponse.json(
      { error: 'Wrong password' },
      { status: 401 }
    );
  }

  const token = await createSessionToken(mode as SessionUser);
  const response = NextResponse.json({ ok: true, user: mode });
  response.cookies.set(
    SESSION_COOKIE.name,
    token,
    SESSION_COOKIE.options
  );
  return response;
}
