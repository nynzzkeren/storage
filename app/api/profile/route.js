import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '../../../lib/db';

export async function GET(request) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfile(auth.value);
  return NextResponse.json({ profile, email: auth.value });
}

export async function PATCH(request) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    
    // Security check: Only nynzz can update other profiles via admin override
    if (updates.targetEmail && auth.value !== 'nynzz@pro.xyz') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const emailToUpdate = updates.targetEmail || auth.value;
    delete updates.targetEmail; // don't save this in db
    
    const updated = await updateProfile(emailToUpdate, updates);
    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
