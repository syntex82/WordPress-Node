import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/reels/upload - Upload a reel video
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('video') as File;
    const thumbnail = formData.get('thumbnail') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, MOV, and WebM are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'reels');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const videoFilename = `${session.user.id}-${timestamp}.${fileExtension}`;
    const videoPath = join(uploadDir, videoFilename);

    // Save video file
    const videoBytes = await file.arrayBuffer();
    const videoBuffer = Buffer.from(videoBytes);
    await writeFile(videoPath, videoBuffer);

    const videoUrl = `/uploads/reels/${videoFilename}`;

    // Handle thumbnail if provided
    let thumbnailUrl: string | undefined;
    if (thumbnail) {
      const thumbnailExtension = thumbnail.name.split('.').pop();
      const thumbnailFilename = `${session.user.id}-${timestamp}-thumb.${thumbnailExtension}`;
      const thumbnailPath = join(uploadDir, thumbnailFilename);

      const thumbnailBytes = await thumbnail.arrayBuffer();
      const thumbnailBuffer = Buffer.from(thumbnailBytes);
      await writeFile(thumbnailPath, thumbnailBuffer);

      thumbnailUrl = `/uploads/reels/${thumbnailFilename}`;
    }

    // Get video metadata (you might want to use a library like fluent-ffmpeg for this)
    // For now, we'll return basic info
    const metadata = {
      videoUrl,
      thumbnailUrl,
      fileSize: file.size,
      mimeType: file.type,
    };

    return NextResponse.json(metadata, { status: 201 });
  } catch (error) {
    console.error('Error uploading reel:', error);
    return NextResponse.json(
      { error: 'Failed to upload reel' },
      { status: 500 }
    );
  }
}

