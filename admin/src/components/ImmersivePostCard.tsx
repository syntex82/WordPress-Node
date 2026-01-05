/**
 * ImmersivePostCard Component
 * TikTok/Instagram-style full-width immersive post card
 * Features: Auto-playing videos, floating action buttons, overlay content, tap controls
 */

import { useState, useCallback, useRef, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal, FiTrash2, 
  FiBookmark, FiVolume2, FiVolumeX, FiPlay, FiPause, FiMaximize2
} from 'react-icons/fi';
import { TimelinePost, timelineApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';

interface ImmersivePostCardProps {
  post: TimelinePost;
  onDelete?: (postId: string) => void;
  onCommentClick?: (postId: string, post: TimelinePost) => void;
  onHashtagClick?: (tag: string) => void;
  onPostShared?: (post: TimelinePost) => void;
  isInView?: boolean;
}

export default function ImmersivePostCard({ 
  post, onDelete, onCommentClick, onHashtagClick, onPostShared, isInView = false 
}: ImmersivePostCardProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const { user: currentUser } = useAuthStore();
  
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const isOwner = currentUser?.id === post.user.id;
  const hasVideo = post.media?.some(m => m.type === 'VIDEO');
  const hasImage = post.media?.some(m => m.type === 'IMAGE');
  const primaryMedia = post.media?.[0];
  const isVerticalVideo = primaryMedia?.type === 'VIDEO' && 
    primaryMedia.height && primaryMedia.width && primaryMedia.height > primaryMedia.width;

  // Auto-play video when in view
  useEffect(() => {
    if (hasVideo && videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isInView, hasVideo]);

  // Hide controls after delay
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        await timelineApi.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
      } else {
        await timelineApi.likePost(post.id);
        setIsLiked(true);
        setLikesCount(c => c + 1);
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }
    } catch {
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      handleLike();
    } else {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  }, [isLiked]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await timelineApi.deletePost(post.id);
      toast.success('Post deleted');
      onDelete?.(post.id);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
    setShowControls(true);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Render content with clickable hashtags and mentions
  const renderContent = useCallback((content: string | undefined) => {
    if (!content) return null;
    const parts = content.split(/(#\w+|@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <button key={index} onClick={() => onHashtagClick?.(part.slice(1))}
            className="text-blue-400 hover:underline font-medium">{part}</button>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const mentionedUser = post.mentions?.find(m => m.username?.toLowerCase() === username.toLowerCase());
        if (mentionedUser) {
          return (
            <Link key={index} to={`/profile/${mentionedUser.username || mentionedUser.id}`}
              className="text-blue-400 hover:underline font-medium">{part}</Link>
          );
        }
        return <span key={index} className="text-blue-400">{part}</span>;
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
  }, [post.mentions, onHashtagClick]);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className={`relative w-full ${isVerticalVideo ? 'h-screen' : 'min-h-[70vh]'} snap-start snap-always
      ${isDark ? 'bg-black' : 'bg-gray-100'}`}>

      {/* Media Container */}
      <div className="absolute inset-0" onClick={hasVideo ? togglePlayPause : handleDoubleTap}
        onDoubleClick={handleDoubleTap}>

        {hasVideo && primaryMedia ? (
          <video ref={videoRef} src={primaryMedia.url} loop muted={isMuted} playsInline
            className="w-full h-full object-cover" poster={primaryMedia.thumbnail} />
        ) : hasImage && primaryMedia ? (
          <img src={primaryMedia.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center p-8
            ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
            <p className={`text-2xl font-medium text-center leading-relaxed
              ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {renderContent(post.content)}
            </p>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Like animation */}
        {showLikeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <FiHeart className="w-32 h-32 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}

        {/* Video controls overlay */}
        {hasVideo && showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!isPlaying && <FiPlay className="w-20 h-20 text-white/80" />}
          </div>
        )}
      </div>

      {/* Top bar - user info and menu */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <Link to={`/profile/${post.user.username || post.user.id}`} className="flex items-center gap-3">
          <img src={post.user.avatar || '/default-avatar.png'} alt={post.user.name}
            className="w-12 h-12 rounded-full border-2 border-white/50 object-cover" />
          <div>
            <p className="text-white font-semibold text-lg drop-shadow-lg">{post.user.name}</p>
            <p className="text-white/70 text-sm drop-shadow">
              @{post.user.username} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {hasVideo && (
            <button onClick={toggleMute}
              className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              <FiMoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl overflow-hidden z-50
                ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                {isOwner && (
                  <button onClick={handleDelete}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-500/10">
                    <FiTrash2 className="w-5 h-5" /> Delete Post
                  </button>
                )}
                <button onClick={() => { setShowMenu(false); }}
                  className={`w-full px-4 py-3 flex items-center gap-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <FiMaximize2 className="w-5 h-5" /> View Full Screen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom content overlay */}
      {(hasVideo || hasImage) && post.content && (
        <div className="absolute bottom-24 left-0 right-20 p-4 z-10">
          <p className="text-white text-lg leading-relaxed drop-shadow-lg line-clamp-3">
            {renderContent(post.content)}
          </p>
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {post.hashtags.map(hashtag => (
                <button key={hashtag.id} onClick={() => onHashtagClick?.(hashtag.tag)}
                  className="text-blue-400 font-medium hover:underline">#{hashtag.tag}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right side action buttons - TikTok style */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
        {/* Like */}
        <button onClick={handleLike} disabled={isLiking}
          className="flex flex-col items-center gap-1 group">
          <div className={`p-3 rounded-full transition-all duration-300
            ${isLiked ? 'bg-red-500 scale-110' : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'}`}>
            <FiHeart className={`w-7 h-7 transition-all ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
          <span className="text-white text-sm font-semibold drop-shadow">{formatCount(likesCount)}</span>
        </button>

        {/* Comments */}
        <button onClick={() => onCommentClick?.(post.id, post)} className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors">
            <FiMessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-sm font-semibold drop-shadow">{formatCount(post.commentsCount)}</span>
        </button>

        {/* Share */}
        <button onClick={() => onPostShared?.(post)} className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors">
            <FiShare2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-sm font-semibold drop-shadow">{formatCount(sharesCount)}</span>
        </button>

        {/* Bookmark */}
        <button onClick={() => setIsBookmarked(!isBookmarked)} className="flex flex-col items-center gap-1 group">
          <div className={`p-3 rounded-full transition-all duration-300
            ${isBookmarked ? 'bg-yellow-500 scale-110' : 'bg-black/30 backdrop-blur-sm hover:bg-black/50'}`}>
            <FiBookmark className={`w-7 h-7 transition-all ${isBookmarked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
        </button>

        {/* User avatar */}
        <Link to={`/profile/${post.user.username || post.user.id}`}
          className="relative mt-2">
          <img src={post.user.avatar || '/default-avatar.png'} alt={post.user.name}
            className="w-12 h-12 rounded-full border-2 border-white object-cover" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full
            flex items-center justify-center text-white text-xs font-bold">+</div>
        </Link>
      </div>

      {/* Click outside to close menu */}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </div>
  );
}

