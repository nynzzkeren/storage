import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const UPLOAD_DIR = path.join(os.tmpdir(), 'uploads');

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {}
}

export async function POST(request) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureUploadDir();
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.name) || '.png';
    const filename = `pp-${auth.value.split('@')[0]}-${uniqueSuffix}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    
    await fs.writeFile(filepath, buffer);
    
    // Return the URL path to access the file
    return NextResponse.json({ success: true, url: `/api/assets/${filename}` });
  } catch (err) {
    console.error('PP Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
  }
}
