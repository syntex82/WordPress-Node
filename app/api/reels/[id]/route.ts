import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reels/[id] - Get a single reel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    const reel = await prisma.reel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          },
        },
      },
    });

    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    // Check if current user has liked this reel
    let isLiked = false;
    if (session?.user?.id) {
      const like = await prisma.reelLike.findUnique({
        where: {
          reelId_userId: {
            reelId: id,
            userId: session.user.id,
          },
        },
      });
      isLiked = !!like;
    }

    return NextResponse.json({
      ...reel,
      isLiked,
    });
  } catch (error) {
    console.error('Error fetching reel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reel' },
      { status: 500 }
    );
  }
}

// DELETE /api/reels/[id] - Delete a reel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if reel exists and belongs to user
    const reel = await prisma.reel.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    if (reel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete reel (cascade will handle related records)
    await prisma.reel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Error deleting reel:', error);
    return NextResponse.json(
      { error: 'Failed to delete reel' },
      { status: 500 }
    );
  }
}

// PATCH /api/reels/[id] - Update a reel
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if reel exists and belongs to user
    const reel = await prisma.reel.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    if (reel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update only allowed fields
    const { caption, isPublic } = body;
    const updatedReel = await prisma.reel.update({
      where: { id },
      data: {
        ...(caption !== undefined && { caption }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            headline: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReel);
  } catch (error) {
    console.error('Error updating reel:', error);
    return NextResponse.json(
      { error: 'Failed to update reel' },
      { status: 500 }
    );
  }
}

