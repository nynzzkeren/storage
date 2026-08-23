import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { getFiles, addFile } from '../../../lib/db';

const UPLOAD_DIR = path.join(os.tmpdir(), 'uploads');

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // ignore if exists
  }
}

export async function GET(request) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allFiles = await getFiles();
  // We can return all files, but maybe filter by user or return all since it's shared between 2 friends?
  // Let's assume it's shared or personal. Let's make it shared, it's simpler and collaborative.
  return NextResponse.json({ files: allFiles });
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
    const files = formData.getAll('files'); // 'files' is the key we'll use in the frontend
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (typeof file === 'string') continue; // Not a file
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueSuffix = crypto.randomBytes(6).toString('hex');
      const ext = path.extname(file.name);
      const base = path.basename(file.name, ext);
      const filename = `${base}-${uniqueSuffix}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      
      await fs.writeFile(filepath, buffer);
      
      const newFile = {
        id: crypto.randomUUID(),
        originalName: file.name,
        filename,
        size: file.size,
        type: file.type,
        uploader: auth.value,
        uploadDate: new Date().toISOString(),
        status: 'active' // can be 'active', 'trash', 'permanent_deleted'
      };
      
      await addFile(newFile);
      uploadedFiles.push(newFile);
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
