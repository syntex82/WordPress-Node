import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReelSchema = z.object({
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(2200).optional(),
  duration: z.number().min(15).max(60),
  width: z.number().optional(),
  height: z.number().optional(),
  fileSize: z.number().optional(),
  isPublic: z.boolean().default(true),
  audioName: z.string().optional(),
  audioUrl: z.string().url().optional(),
  hashtags: z.array(z.string()).optional(),
});

// GET /api/reels - Get reels feed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    const where: any = { isPublic: true };
    if (userId) {
      where.userId = userId;
    }

    const [reels, total] = await Promise.all([
      prisma.reel.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              headline: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reel.count({ where }),
    ]);

    // Check if current user has liked each reel
    let reelsWithLikeStatus = reels;
    if (session?.user?.id) {
      const likedReels = await prisma.reelLike.findMany({
        where: {
          userId: session.user.id,
          reelId: { in: reels.map(r => r.id) },
        },
        select: { reelId: true },
      });
      const likedReelIds = new Set(likedReels.map(l => l.reelId));
      
      reelsWithLikeStatus = reels.map(reel => ({
        ...reel,
        isLiked: likedReelIds.has(reel.id),
      }));
    }

    return NextResponse.json({
      reels: reelsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reels' },
      { status: 500 }
    );
  }
}

// POST /api/reels - Create a new reel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReelSchema.parse(body);

    const { hashtags, ...reelData } = validatedData;

    // Create reel
    const reel = await prisma.reel.create({
      data: {
        ...reelData,
        userId: session.user.id,
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

    // Process hashtags if provided
    if (hashtags && hashtags.length > 0) {
      const hashtagPromises = hashtags.map(async (tag) => {
        const normalizedTag = tag.toLowerCase().replace(/^#/, '');
        
        // Upsert hashtag
        const hashtag = await prisma.hashtag.upsert({
          where: { tag: normalizedTag },
          create: { tag: normalizedTag, postCount: 1 },
          update: { postCount: { increment: 1 } },
        });

        // Create reel-hashtag relationship
        return prisma.reelHashtag.create({
          data: {
            reelId: reel.id,
            hashtagId: hashtag.id,
          },
        });
      });

      await Promise.all(hashtagPromises);
    }

    return NextResponse.json(reel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating reel:', error);
    return NextResponse.json(
      { error: 'Failed to create reel' },
      { status: 500 }
    );
  }
}

