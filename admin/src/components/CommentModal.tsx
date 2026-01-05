/**
 * Comment Modal Component
 * Full-screen modal showing post content with comments feed
 * Optimized for mobile with proper input handling
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiX, FiSend, FiCornerDownRight, FiHeart, FiShare2, FiChevronLeft, FiVideo, FiMic } from 'react-icons/fi';
import { timelineApi, PostComment, TimelinePost } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';
import MobileMediaRecorder from './MobileMediaRecorder';

interface CommentModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  post?: TimelinePost;
}

export default function CommentModal({ postId, isOpen, onClose, onCommentAdded, post }: CommentModalProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [postData, setPostData] = useState<TimelinePost | null>(post || null);
  const [loadingPost, setLoadingPost] = useState(!post);
  const [inputFocused, setInputFocused] = useState(false);
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);
  const [mediaRecorderMode, setMediaRecorderMode] = useState<'video' | 'audio'>('video');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
      if (!post) {
        loadPost();
      } else {
        setPostData(post);
        setLoadingPost(false);
      }
    }
  }, [isOpen, postId, post]);

  useEffect(() => {
    if (isOpen && inputRef.current && !loading) {
      // Delay focus to ensure proper rendering on mobile
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, replyingTo, loading]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadPost = async () => {
    try {
      setLoadingPost(true);
      const res = await timelineApi.getPost(postId);
      setPostData(res.data);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoadingPost(false);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await timelineApi.getComments(postId);
      console.log('Comments response:', res.data);
      setComments(res.data.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await timelineApi.addComment(postId, newComment.trim(), replyingTo || undefined);
      console.log('Add comment response:', res.data);
      if (replyingTo) {
        // Add reply to parent comment
        setComments(prev => prev.map(c =>
          c.id === replyingTo
            ? { ...c, replies: [...(c.replies || []), res.data] }
            : c
        ));
      } else {
        // Add new top-level comment
        setComments(prev => [res.data, ...prev]);
      }
      setNewComment('');
      setReplyingTo(null);
      onCommentAdded?.();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle video/audio comment recording
  const handleMediaCaptured = async (media: { type: 'VIDEO' | 'AUDIO'; url: string; thumbnail?: string }) => {
    // For now, just show a toast - video comments could be a future feature
    toast.success(`${media.type.toLowerCase()} recorded! Video comments coming soon.`);
    setShowMediaRecorder(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full-screen modal */}
      <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {/* Header - Fixed */}
        <div className={`flex-shrink-0 flex items-center gap-3 px-3 sm:px-4 py-3 border-b safe-area-inset-top ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`p-2 -ml-1 rounded-full transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <h3 className={`text-lg font-semibold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Comments</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Post Content */}
          {(loadingPost || loading) && !postData ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : postData && (
            <div className={`p-4 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              {/* Post Author */}
              <div className="flex items-start gap-3 mb-3">
                <Link to={`/profile/${postData.user.username || postData.user.id}`}>
                  {postData.user.avatar ? (
                    <img src={postData.user.avatar} alt={postData.user.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {postData.user.name.charAt(0)}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${postData.user.username || postData.user.id}`}
                    className={`font-semibold hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    {postData.user.name}
                  </Link>
                  {postData.user.headline && (
                    <p className={`text-sm line-clamp-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{postData.user.headline}</p>
                  )}
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {formatDistanceToNow(new Date(postData.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {postData.content && (
                <p className={`whitespace-pre-wrap mb-3 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  {postData.content}
                </p>
              )}

              {/* Post Media */}
              {postData.media && postData.media.length > 0 && (
                <div className="rounded-xl overflow-hidden mb-3">
                  {postData.media.map((m, idx) => (
                    <div key={m.id || idx}>
                      {m.type === 'IMAGE' && (
                        <img src={m.url} alt={m.altText || ''} className="w-full max-h-96 object-cover" />
                      )}
                      {m.type === 'VIDEO' && (
                        <video src={m.url} controls className="w-full max-h-96" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Stats */}
              <div className={`flex items-center gap-6 pt-3 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span className="flex items-center gap-1.5">
                  <FiHeart className="w-4 h-4" /> {postData.likesCount} likes
                </span>
                <span className="flex items-center gap-1.5">
                  {comments.length} comments
                </span>
                <span className="flex items-center gap-1.5">
                  <FiShare2 className="w-4 h-4" /> {postData.sharesCount} shares
                </span>
              </div>
            </div>
          )}

          {/* Comments Header */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <h4 className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {loading ? 'Loading comments...' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
            </h4>
          </div>

          {/* Comments List */}
          <div className={`p-4 space-y-4 ${isDark ? '' : 'bg-white'}`}>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <p className="text-lg mb-1">No comments yet</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={(id) => {
                    setReplyingTo(id);
                    inputRef.current?.focus();
                  }}
                  isDark={isDark}
                />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Input - Fixed at bottom with safe area */}
        <div className={`flex-shrink-0 border-t safe-area-inset-bottom ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          {replyingTo && (
            <div className={`flex items-center gap-2 px-4 pt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <FiCornerDownRight className="w-4 h-4 flex-shrink-0" />
              <span>Replying to comment</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-blue-500 hover:underline ml-auto"
              >
                Cancel
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="p-3 sm:p-4">
            <div className="flex gap-2 items-end">
              {/* Video/Audio record buttons */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setMediaRecorderMode('video'); setShowMediaRecorder(true); }}
                  className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Record video"
                >
                  <FiVideo className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setMediaRecorderMode('audio'); setShowMediaRecorder(true); }}
                  className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Record audio"
                >
                  <FiMic className="w-5 h-5" />
                </button>
              </div>

              {/* Comment input - using textarea for better mobile experience */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
                  rows={1}
                  style={{
                    minHeight: '44px',
                    maxHeight: '120px',
                    resize: 'none'
                  }}
                  className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-base leading-snug ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white placeholder-slate-400'
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Media Recorder Modal */}
      <MobileMediaRecorder
        isOpen={showMediaRecorder}
        onClose={() => setShowMediaRecorder(false)}
        onMediaCaptured={handleMediaCaptured}
        mode={mediaRecorderMode}
      />
    </>
  );
}

// Individual Comment Item
function CommentItem({ comment, onReply, isDark }: { comment: PostComment; onReply: (id: string) => void; isDark: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {comment.user.avatar ? (
          <img src={comment.user.avatar} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {comment.user.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className={`rounded-lg px-3 py-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {comment.user.name}
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{comment.content}</p>
          </div>
          <div className={`flex items-center gap-4 mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            <button
              onClick={() => onReply(comment.id)}
              className="hover:text-blue-500"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex gap-3">
              {reply.user.avatar ? (
                <img src={reply.user.avatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                  {reply.user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className={`rounded-lg px-3 py-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {reply.user.name}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{reply.content}</p>
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

