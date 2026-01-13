import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/reels/[id]/like - Like a reel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reelId } = params;

    // Check if reel exists
    const reel = await prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await prisma.reelLike.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this reel' },
        { status: 400 }
      );
    }

    // Create like and update count
    await prisma.$transaction([
      prisma.reelLike.create({
        data: {
          reelId,
          userId: session.user.id,
        },
      }),
      prisma.reel.update({
        where: { id: reelId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ message: 'Reel liked successfully' });
  } catch (error) {
    console.error('Error liking reel:', error);
    return NextResponse.json(
      { error: 'Failed to like reel' },
      { status: 500 }
    );
  }
}

// DELETE /api/reels/[id]/like - Unlike a reel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reelId } = params;

    // Check if like exists
    const existingLike = await prisma.reelLike.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId: session.user.id,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }

    // Delete like and update count
    await prisma.$transaction([
      prisma.reelLike.delete({
        where: {
          reelId_userId: {
            reelId,
            userId: session.user.id,
          },
        },
      }),
      prisma.reel.update({
        where: { id: reelId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ message: 'Reel unliked successfully' });
  } catch (error) {
    console.error('Error unliking reel:', error);
    return NextResponse.json(
      { error: 'Failed to unlike reel' },
      { status: 500 }
    );
  }
}

