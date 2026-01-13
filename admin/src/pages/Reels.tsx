/**
 * Reels Page - TikTok-style vertical video feed
 * Features: Auto-play, snap scrolling, like/comment/share
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { reelsApi, Reel } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import {
  FiHeart, FiMessageCircle, FiShare2, FiVolume2, FiVolumeX,
  FiPlay, FiPause, FiChevronUp, FiChevronDown, FiPlus, FiUser, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Reels() {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const [searchParams] = useSearchParams();
  const initialReelId = searchParams.get('reel');
  
  const { user } = useAuthStore();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Load reels
  const loadReels = useCallback(async (pageNum: number) => {
    try {
      const res = await reelsApi.getReels(pageNum, 10);
      const newReels = res.data?.reels || [];
      
      if (pageNum === 1) {
        setReels(newReels);
        // Find initial reel if specified
        if (initialReelId) {
          const idx = newReels.findIndex(r => r.id === initialReelId);
          if (idx >= 0) setCurrentIndex(idx);
        }
      } else {
        setReels(prev => [...prev, ...newReels]);
      }
      
      setHasMore(newReels.length === 10);
    } catch (err) {
      console.error('Error loading reels:', err);
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, [initialReelId]);

  useEffect(() => {
    loadReels(1);
  }, [loadReels]);

  // Handle video playback
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === currentIndex) {
        video.currentTime = 0;
        if (playing) video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex, playing]);

  // Handle scroll snap
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
      // Load more when near end
      if (newIndex >= reels.length - 3 && hasMore && !loading) {
        setPage(p => p + 1);
        loadReels(page + 1);
      }
    }
  }, [currentIndex, reels.length, hasMore, loading, page, loadReels]);

  // Like reel
  const handleLike = async (reel: Reel) => {
    if (!user) {
      toast.error('Please log in to like');
      return;
    }
    try {
      if (reel.isLiked) {
        await reelsApi.unlikeReel(reel.id);
      } else {
        await reelsApi.likeReel(reel.id);
      }
      setReels(prev => prev.map(r => 
        r.id === reel.id 
          ? { ...r, isLiked: !r.isLiked, likesCount: r.likesCount + (r.isLiked ? -1 : 1) }
          : r
      ));
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  // Navigate reels
  const goToReel = (direction: 'up' | 'down') => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < reels.length) {
      containerRef.current.scrollTo({ top: newIndex * height, behavior: 'smooth' });
    }
  };

  const currentReel = reels[currentIndex];

  if (loading && reels.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <FiPlay className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Reels Yet</h2>
        <p className="text-slate-500 mb-6">Be the first to create a reel!</p>
        <Link to="/profile" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium">
          Create Reel
        </Link>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black' : 'bg-gray-900'}`}>
      {/* Close button */}
      <Link to="/profile" className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
        <FiX className="w-6 h-6" />
      </Link>

      {/* Reels container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, idx) => (
          <div key={reel.id} className="h-full w-full snap-start relative flex items-center justify-center">
            {/* Video */}
            <video
              ref={el => videoRefs.current[idx] = el}
              src={reel.videoUrl}
              poster={reel.thumbnailUrl}
              loop
              muted={muted}
              playsInline
              onClick={() => setPlaying(!playing)}
              className="h-full w-full object-contain max-w-[500px] mx-auto"
            />

            {/* Play/Pause overlay */}
            {!playing && idx === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                  <FiPlay className="w-10 h-10 text-white ml-1" />
                </div>
              </div>
            )}

            {/* Right sidebar actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
              {/* User avatar */}
              <Link to={`/u/${reel.user.id}`} className="relative">
                {reel.user.avatar ? (
                  <img src={reel.user.avatar} alt={reel.user.name} className="w-12 h-12 rounded-full border-2 border-white" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center border-2 border-white">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <FiPlus className="w-3 h-3 text-white" />
                </div>
              </Link>

              {/* Like */}
              <button onClick={() => handleLike(reel)} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${reel.isLiked ? 'bg-pink-500' : 'bg-white/20'}`}>
                  <FiHeart className={`w-6 h-6 ${reel.isLiked ? 'text-white fill-current' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium">{reel.likesCount}</span>
              </button>

              {/* Comments */}
              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FiMessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">{reel.commentsCount}</span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FiShare2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">Share</span>
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute left-4 right-20 bottom-8">
              <Link to={`/u/${reel.user.id}`} className="font-semibold text-white mb-1 hover:underline">
                @{reel.user.name}
              </Link>
              {reel.caption && (
                <p className="text-white/90 text-sm line-clamp-2">{reel.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={() => goToReel('up')}
          disabled={currentIndex === 0}
          className="p-2 bg-white/20 rounded-full text-white disabled:opacity-30"
        >
          <FiChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => goToReel('down')}
          disabled={currentIndex === reels.length - 1}
          className="p-2 bg-white/20 rounded-full text-white disabled:opacity-30"
        >
          <FiChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white"
      >
        {muted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}

