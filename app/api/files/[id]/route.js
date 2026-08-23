import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getFile, updateFileStatus } from '../../../../lib/db';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(request, { params }) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = params;
  const fileData = await getFile(id);

  if (!fileData) {
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    const filePath = path.join(UPLOAD_DIR, fileData.filename);
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type based on the stored type or default to octet-stream
    const contentType = fileData.type || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileData.originalName}"`,
      }
    });
  } catch (err) {
    console.error(err);
    return new NextResponse('File missing on disk', { status: 404 });
  }
}

export async function PATCH(request, { params }) {
  const cookieStore = cookies();
  const auth = cookieStore.get('auth');
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const { status } = body;

  if (!['active', 'trash', 'permanent_deleted'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updatedFile = await updateFileStatus(id, status);
  if (!updatedFile) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, file: updatedFile });
}
