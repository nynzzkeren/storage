import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getProfile } from '../../../../lib/db';

export async function GET(request, { params }) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth || auth.value !== 'nynzz@pro.xyz') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profile = await getProfile(params.email);
  return NextResponse.json({ profile });
}
