import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const USERS = {
  'zuraya@pro.xyz': '12345',
  'nynzz@pro.xyz': '12345'
};

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (USERS[email] && USERS[email] === password) {
      cookies().set('auth', email, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
