import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kaaf.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'local-dev-secret');

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    console.log(`Login attempt for email: ${email}`);

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.warn(`Invalid login attempt for email: ${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await new SignJWT({ email, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    console.log(`Successful login for email: ${email}`);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
