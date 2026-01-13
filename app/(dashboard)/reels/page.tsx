'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Play, Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  user: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
  };
  createdAt: string;
}

export default function ReelsPage() {
  const { data: session } = useSession();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    // Play current video and pause others
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const fetchReels = async () => {
    try {
      const response = await fetch('/api/reels');
      if (!response.ok) throw new Error('Failed to fetch reels');
      const data = await response.json();
      setReels(data.reels);
    } catch (error) {
      console.error('Error fetching reels:', error);
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    if (!session) {
      toast.error('Please sign in to like reels');
      return;
    }

    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;

    const isLiked = reel.isLiked;
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`/api/reels/${reelId}/like`, { method });
      if (!response.ok) throw new Error('Failed to update like');

      setReels(reels.map(r => 
        r.id === reelId 
          ? { 
              ...r, 
              isLiked: !isLiked,
              likesCount: isLiked ? r.likesCount - 1 : r.likesCount + 1
            }
          : r
      ));
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const trackView = async (reelId: string, watchTime: number, completed: boolean) => {
    try {
      await fetch(`/api/reels/${reelId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTime, completed }),
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-muted-foreground mb-4">No reels available</p>
        <Button onClick={() => window.location.href = '/reels/create'}>
          Create Your First Reel
        </Button>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Video Container */}
      <div className="relative h-full w-full max-w-md mx-auto">
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className={`absolute inset-0 transition-transform duration-300 ${
              index === currentIndex ? 'translate-y-0' : index < currentIndex ? '-translate-y-full' : 'translate-y-full'
            }`}
          >
            <video
              ref={el => videoRefs.current[index] = el}
              src={reel.videoUrl}
              poster={reel.thumbnailUrl}
              loop
              muted={muted}
              playsInline
              className="w-full h-full object-cover"
              onEnded={() => trackView(reel.id, reel.duration, true)}
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.currentTime > 3) {
                  trackView(reel.id, Math.floor(video.currentTime), false);
                }
              }}
            />

            {/* Overlay UI */}
            {index === currentIndex && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />

                {/* User info and caption */}
                <div className="absolute bottom-20 left-4 right-20 pointer-events-auto">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarImage src={reel.user.avatar} />
                      <AvatarFallback>{reel.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{reel.user.name}</p>
                      {reel.user.headline && (
                        <p className="text-white/80 text-sm">{reel.user.headline}</p>
                      )}
                    </div>
                  </div>
                  {reel.caption && (
                    <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute bottom-20 right-4 flex flex-col gap-6 pointer-events-auto">
                  <button
                    onClick={() => handleLike(reel.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={`p-3 rounded-full ${reel.isLiked ? 'bg-red-500' : 'bg-white/20'} backdrop-blur-sm`}>
                      <Heart className={`h-6 w-6 ${reel.isLiked ? 'fill-white text-white' : 'text-white'}`} />
                    </div>
                    <span className="text-white text-xs font-semibold">{reel.likesCount}</span>
                  </button>

                  <button
                    onClick={() => window.location.href = `/reels/${reel.id}/comments`}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold">{reel.commentsCount}</span>
                  </button>

                  <button className="flex flex-col items-center gap-1">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                  </button>

                  <button
                    onClick={() => setMuted(!muted)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      {muted ? (
                        <VolumeX className="h-6 w-6 text-white" />
                      ) : (
                        <Volume2 className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={() => handleScroll('up')}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 p-2 text-white/50 hover:text-white"
          >
            ↑
          </button>
        )}
        {currentIndex < reels.length - 1 && (
          <button
            onClick={() => handleScroll('down')}
            className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-full z-10 p-2 text-white/50 hover:text-white"
          >
            ↓
          </button>
        )}
      </div>
    </div>
  );
}

