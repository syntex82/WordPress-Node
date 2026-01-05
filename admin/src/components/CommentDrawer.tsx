/**
 * CommentDrawer Component
 * TikTok-style slide-up comment drawer with reactions and smooth animations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiX, FiHeart, FiSend, FiSmile, FiTrash2 } from 'react-icons/fi';
import { TimelinePost, PostComment, timelineApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  post: TimelinePost | null;
  onCommentAdded?: () => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '🙏'];

export default function CommentDrawer({ isOpen, onClose, post, onCommentAdded }: CommentDrawerProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const { user: currentUser } = useAuthStore();
  
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Fetch comments when drawer opens
  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    }
  }, [isOpen, post?.id]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const fetchComments = async () => {
    if (!post) return;
    setIsLoading(true);
    try {
      const response = await timelineApi.getComments(post.id);
      setComments(response.data.data);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await timelineApi.addComment(post.id, newComment.trim());
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      onCommentAdded?.();
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    if (!post) return;
    setIsSubmitting(true);
    try {
      const response = await timelineApi.addComment(post.id, emoji);
      setComments(prev => [response.data, ...prev]);
      onCommentAdded?.();
      setShowReactions(false);
    } catch {
      toast.error('Failed to add reaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await timelineApi.deleteComment(post!.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  // Touch handlers for drag-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 150) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300" onClick={onClose} />

      {/* Drawer */}
      <div ref={drawerRef}
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out
          ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        style={{
          maxHeight: '75vh',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {post?.commentsCount || 0} Comments
          </h3>
          <button onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Comments list */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(75vh - 180px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <FiSmile className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No comments yet</p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Be the first to comment!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {comments.map(comment => (
                <div key={comment.id} className={`p-4 ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <div className="flex gap-3">
                    <Link to={`/profile/${comment.user.username || comment.user.id}`}>
                      <img src={comment.user.avatar || '/default-avatar.png'} alt={comment.user.name}
                        className="w-10 h-10 rounded-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${comment.user.username || comment.user.id}`}
                          className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {comment.user.name}
                        </Link>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{comment.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-xs transition-colors
                            ${likedComments.has(comment.id) ? 'text-red-500' : isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>
                          <FiHeart className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                          <span>{(comment.likesCount || 0) + (likedComments.has(comment.id) ? 1 : 0)}</span>
                        </button>
                        <button className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                          Reply
                        </button>
                        {currentUser?.id === comment.user.id && (
                          <button onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 hover:text-red-600">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick reactions */}
        {showReactions && (
          <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex justify-around">
              {QUICK_REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => handleQuickReaction(emoji)}
                  className="text-3xl hover:scale-125 transition-transform active:scale-95">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <img src={currentUser?.avatar || '/default-avatar.png'} alt="You"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 relative">
              <input ref={inputRef} type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className={`w-full px-4 py-3 pr-20 rounded-full text-sm transition-colors
                  ${isDark ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-700'
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-gray-200'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50`} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" onClick={() => setShowReactions(!showReactions)}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                  <FiSmile className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                <button type="submit" disabled={!newComment.trim() || isSubmitting}
                  className={`p-2 rounded-full transition-all
                    ${newComment.trim() ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

