import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const trackViewSchema = z.object({
  watchTime: z.number().min(0),
  completed: z.boolean().default(false),
});

// POST /api/reels/[id]/view - Track a view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: reelId } = params;
    const body = await request.json();
    const validatedData = trackViewSchema.parse(body);

    // Check if reel exists
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    // Get IP address for anonymous tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check if view already exists for this user/IP
    const existingView = await prisma.reelView.findFirst({
      where: {
        reelId,
        ...(session?.user?.id 
          ? { userId: session.user.id }
          : { ipAddress, userId: null }
        ),
      },
    });

    if (existingView) {
      // Update existing view
      await prisma.reelView.update({
        where: { id: existingView.id },
        data: {
          watchTime: Math.max(existingView.watchTime, validatedData.watchTime),
          completed: existingView.completed || validatedData.completed,
        },
      });
    } else {
      // Create new view and increment count
      await prisma.$transaction([
        prisma.reelView.create({
          data: {
            reelId,
            userId: session?.user?.id,
            ipAddress: session?.user?.id ? null : ipAddress,
            watchTime: validatedData.watchTime,
            completed: validatedData.completed,
          },
        }),
        prisma.reel.update({
          where: { id: reelId },
          data: { viewsCount: { increment: 1 } },
        }),
      ]);
    }

    return NextResponse.json({ message: 'View tracked successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}

