import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(request, { params }) {
  const { filename } = params;

  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    const fileBuffer = await fs.readFile(filePath);
    
    // basic content type detection
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      }
    });
  } catch (err) {
    return new NextResponse('Asset not found', { status: 404 });
  }
}
