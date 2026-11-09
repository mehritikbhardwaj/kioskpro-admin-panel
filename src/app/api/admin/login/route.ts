import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ success: false, message: 'Invalid Admin Password' }, { status: 401 });
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json({ success: true, message: 'Logged in successfully' });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
