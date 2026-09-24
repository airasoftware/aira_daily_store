import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createSession, sameOrigin, verifyPassword } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_SESSION_SECRET) return NextResponse.json({ error: 'Akun admin belum dikonfigurasi.' }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data login tidak valid.' }, { status: 400 }); }
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') return NextResponse.json({ error: 'Data login tidak valid.' }, { status: 400 });
  if (body.email.trim().toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() || !verifyPassword(body.password)) return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
  const session = createSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, session.value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: session.maxAge });
  return response;
}
