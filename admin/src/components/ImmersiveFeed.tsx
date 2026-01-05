/**
 * ImmersiveFeed Component
 * TikTok-style full-screen vertical scrolling feed
 * Features: Snap scrolling, auto-play videos, infinite scroll, pull-to-refresh
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiRefreshCw, FiGrid, FiArrowUp } from 'react-icons/fi';
import { TimelinePost, timelineApi } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import ImmersivePostCard from './ImmersivePostCard';
import CommentDrawer from './CommentDrawer';
import ShareModal from './ShareModal';
import toast from 'react-hot-toast';

interface ImmersiveFeedProps {
  initialPosts?: TimelinePost[];
  onSwitchToGrid?: () => void;
}

export default function ImmersiveFeed({ initialPosts, onSwitchToGrid }: ImmersiveFeedProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<TimelinePost[]>(initialPosts || []);
  const [isLoading, setIsLoading] = useState(!initialPosts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set());
  
  // Comment drawer state
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TimelinePost | null>(null);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState<TimelinePost | null>(null);
  
  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pullStartY = useRef(0);

  // Fetch posts
  const fetchPosts = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setPage(1);
    } else if (!hasMore || isLoading) {
      return;
    }

    try {
      const currentPage = refresh ? 1 : page;
      const response = await timelineApi.getDiscover(currentPage, 10);

      if (refresh) {
        setPosts(response.data.data);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...response.data.data]);
        setPage(prev => prev + 1);
      }

      setHasMore(response.data.meta.hasMore);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, hasMore, isLoading]);

  // Initial load
  useEffect(() => {
    if (!initialPosts) {
      fetchPosts();
    }
  }, []);

  // Set up intersection observer for visibility tracking
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const postId = entry.target.getAttribute('data-post-id');
          if (postId) {
            setVisiblePosts(prev => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(postId);
                // Update current index
                const index = posts.findIndex(p => p.id === postId);
                if (index !== -1 && entry.intersectionRatio > 0.5) {
                  setCurrentIndex(index);
                }
              } else {
                newSet.delete(postId);
              }
              return newSet;
            });
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );

    return () => observerRef.current?.disconnect();
  }, [posts]);

  // Observe post elements
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !observerRef.current) return;

    const postElements = container.querySelectorAll('[data-post-id]');
    postElements.forEach(el => observerRef.current?.observe(el));

    return () => {
      postElements.forEach(el => observerRef.current?.unobserve(el));
    };
  }, [posts]);

  // Load more when near end
  useEffect(() => {
    if (currentIndex >= posts.length - 3 && hasMore && !isLoading) {
      fetchPosts();
    }
  }, [currentIndex, posts.length, hasMore, isLoading, fetchPosts]);

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const deltaY = e.touches[0].clientY - pullStartY.current;
    if (deltaY > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(deltaY * 0.5, 100));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      fetchPosts(true);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const handleCommentClick = (postId: string, post: TimelinePost) => {
    setSelectedPost(post);
    setCommentDrawerOpen(true);
  };

  const handleShareClick = (post: TimelinePost) => {
    setSharePost(post);
    setShareModalOpen(true);
  };

  const handleHashtagClick = (tag: string) => {
    navigate(`/timeline?hashtag=${tag}`);
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Pull to refresh indicator */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center overflow-hidden"
        style={{ height: pullDistance, transition: isPulling ? 'none' : 'height 0.3s ease-out' }}>
        <div className={`flex items-center justify-center ${pullDistance > 60 ? 'text-blue-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <FiRefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      </div>

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className={`px-4 py-2 rounded-full backdrop-blur-md ${isDark ? 'bg-black/50' : 'bg-white/50'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentIndex + 1} / {posts.length}
          </span>
        </div>

        {onSwitchToGrid && (
          <button onClick={onSwitchToGrid}
            className={`p-3 rounded-full backdrop-blur-md transition-colors
              ${isDark ? 'bg-black/50 text-white hover:bg-black/70' : 'bg-white/50 text-gray-900 hover:bg-white/70'}`}>
            <FiGrid className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main feed container */}
      <div ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollSnapType: 'y mandatory' }}>

        {posts.map((post) => (
          <div key={post.id} data-post-id={post.id} className="snap-start snap-always">
            <ImmersivePostCard
              post={post}
              isInView={visiblePosts.has(post.id)}
              onDelete={handlePostDelete}
              onCommentClick={handleCommentClick}
              onHashtagClick={handleHashtagClick}
              onPostShared={handleShareClick}
            />
          </div>
        ))}

        {/* Loading more indicator */}
        {isLoading && posts.length > 0 && (
          <div className={`h-screen flex items-center justify-center snap-start ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* End of feed */}
        {!hasMore && posts.length > 0 && (
          <div className={`h-screen flex flex-col items-center justify-center gap-4 snap-start ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
            <p className={`text-xl font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>You're all caught up!</p>
            <button onClick={scrollToTop}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
              <FiArrowUp className="w-5 h-5" />
              Back to top
            </button>
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      {currentIndex > 2 && (
        <button onClick={scrollToTop}
          className={`fixed bottom-24 right-4 z-20 p-4 rounded-full shadow-lg transition-all
            ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'}`}>
          <FiArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Comment drawer */}
      <CommentDrawer
        isOpen={commentDrawerOpen}
        onClose={() => setCommentDrawerOpen(false)}
        post={selectedPost}
        onCommentAdded={() => {
          if (selectedPost) {
            setPosts(prev => prev.map(p =>
              p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
            ));
          }
        }}
      />

      {/* Share modal */}
      {sharePost && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          post={sharePost}
          onShared={() => {
            setPosts(prev => prev.map(p =>
              p.id === sharePost.id ? { ...p, sharesCount: p.sharesCount + 1 } : p
            ));
          }}
        />
      )}

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

