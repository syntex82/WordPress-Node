/**
 * PostCard Component
 * Displays a rich timeline post with text, images, videos, and interactions
 * Supports hashtags, mentions, sharing, and real-time updates
 */

import { useState, useCallback, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal, FiTrash2, FiEdit2, FiPlay, FiRepeat, FiX, FiCopy, FiCheck, FiImage, FiVideo } from 'react-icons/fi';
import { TimelinePost, timelineApi, profileApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';
import PostMediaGallery from './PostMediaGallery';

interface PostCardProps {
  post: TimelinePost;
  onDelete?: (postId: string) => void;
  onEdit?: (post: TimelinePost) => void;
  onCommentClick?: (postId: string, post: TimelinePost) => void;
  onHashtagClick?: (tag: string) => void;
  onPostShared?: (post: TimelinePost) => void;
}

export default function PostCard({ post, onDelete, onEdit, onCommentClick, onHashtagClick, onPostShared }: PostCardProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  const { user: currentUser } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state with prop changes (e.g., when post data is refreshed)
  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setSharesCount(post.sharesCount);
  }, [post.id, post.isLiked, post.likesCount, post.sharesCount]);

  const isOwner = currentUser?.id === post.user.id;
  const isSharedPost = !!post.originalPost;
  const postUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        await timelineApi.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        await timelineApi.likePost(post.id);
        setIsLiked(true);
        setLikesCount((c) => c + 1);
      }
    } catch {
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await timelineApi.deletePost(post.id);
      toast.success('Post deleted');
      onDelete?.(post.id);
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete post';
      toast.error(errorMessage);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      console.log('Sharing post:', post.id, 'with comment:', shareComment.trim() || '(none)');
      const res = await timelineApi.sharePost(post.id, shareComment.trim() || undefined);
      console.log('Share response:', res.data);
      setSharesCount((c) => c + 1);
      setShowShareModal(false);
      setShareComment('');
      toast.success('Post shared!');
      onPostShared?.(res.data);
    } catch (error) {
      console.error('Failed to share post:', error);
      toast.error('Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  // Render content with clickable hashtags and mentions
  const renderContent = useCallback((content: string | undefined) => {
    if (!content) return null;

    // Split content by hashtags and mentions
    const parts = content.split(/(#\w+|@\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <button
            key={index}
            onClick={() => onHashtagClick?.(tag)}
            className={`hover:underline font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
          >
            {part}
          </button>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        // Check if this mention exists in the post's mentions
        const mentionedUser = post.mentions?.find(
          (m) => m.username?.toLowerCase() === username.toLowerCase()
        );
        if (mentionedUser) {
          return (
            <Link
              key={index}
              to={`/profile/${mentionedUser.username || mentionedUser.id}`}
              className={`hover:underline font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            >
              {part}
            </Link>
          );
        }
        return <span key={index} className={isDark ? 'text-blue-400' : 'text-blue-600'}>{part}</span>;
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
  }, [post.mentions, onHashtagClick, isDark]);

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <div className="-mx-3 sm:mx-0 mt-3">
        <PostMediaGallery
          media={post.media.map(m => ({
            id: m.id,
            type: m.type,
            url: m.url,
            thumbnail: m.thumbnail,
            altText: m.altText,
            width: m.width,
            height: m.height,
            duration: m.duration,
          }))}
          className="sm:rounded-xl"
          immersive={true}
        />
      </div>
    );
  };

  return (
    <div className={`rounded-none sm:rounded-xl shadow-none sm:shadow-sm p-3 sm:p-4 mb-0 sm:mb-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to={`/admin/profile/${post.user.username || post.user.id}`}>
            {post.user.avatar ? (
              <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg">
                {post.user.name.charAt(0)}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/admin/profile/${post.user.username || post.user.id}`}
              className={`font-semibold hover:underline text-sm sm:text-base block truncate ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {post.user.name}
            </Link>
            {post.user.headline && (
              <p className={`text-xs sm:text-sm line-clamp-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{post.user.headline}</p>
            )}
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Menu - always show for owner */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
            >
              <FiMoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
            </button>
            {showMenu && (
              <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg border z-10 ${
                isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
              }`}>
                {/* Edit button - only for non-shared posts */}
                {!isSharedPost && onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(post);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 ${isDark ? 'text-slate-200 hover:bg-slate-600' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit Post
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-red-500 ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-100'}`}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share indicator for shared posts */}
      {isSharedPost && (
        <div className={`mt-2 flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          <FiRepeat className="w-4 h-4" />
          <span>Shared a post</span>
        </div>
      )}

      {/* Share comment */}
      {post.shareComment && (
        <p className={`mt-3 whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
          {renderContent(post.shareComment)}
        </p>
      )}

      {/* Original post (for shares) */}
      {isSharedPost && post.originalPost && (
        <div className={`mt-3 border rounded-xl p-4 ${
          isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <Link to={`/profile/${post.originalPost.user.username || post.originalPost.user.id}`}>
              {post.originalPost.user.avatar ? (
                <img
                  src={post.originalPost.user.avatar}
                  alt={post.originalPost.user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {post.originalPost.user.name.charAt(0)}
                </div>
              )}
            </Link>
            <div>
              <Link
                to={`/profile/${post.originalPost.user.username || post.originalPost.user.id}`}
                className={`font-semibold text-sm hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                {post.originalPost.user.name}
              </Link>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {formatDistanceToNow(new Date(post.originalPost.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {post.originalPost.content && (
            <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              {post.originalPost.content}
            </p>
          )}
          {/* Original post media */}
          {post.originalPost.media && post.originalPost.media.length > 0 && (
            <div className="mt-3 -mx-2">
              <PostMediaGallery
                media={post.originalPost.media.map(m => ({
                  id: m.id,
                  type: m.type,
                  url: m.url,
                  thumbnail: m.thumbnail,
                  altText: m.altText,
                  width: m.width,
                  height: m.height,
                  duration: m.duration,
                }))}
                className="rounded-lg"
                immersive={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {post.content && !isSharedPost && (
        <p className={`mt-3 whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
          {renderContent(post.content)}
        </p>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Actions */}
      <div className={`mt-4 flex items-center gap-6 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 transition-colors ${
            isLiked ? 'text-red-500' : `${isDark ? 'text-slate-400' : 'text-gray-500'} hover:text-red-500`
          }`}
        >
          <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </button>

        <button
          onClick={() => onCommentClick?.(post.id, post)}
          className={`flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-500'} hover:text-blue-500`}
        >
          <FiMessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentsCount}</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className={`flex items-center gap-2 transition-colors ${
            post.isShared ? 'text-green-500' : `${isDark ? 'text-slate-400' : 'text-gray-500'} hover:text-green-500`
          }`}
        >
          <FiShare2 className="w-5 h-5" />
          <span className="text-sm">{sharesCount}</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className={`rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Full post preview */}
            <div className={`border rounded-lg p-4 mb-4 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'}`}>
              {/* Author info */}
              <div className="flex items-center gap-3 mb-3">
                {post.user.avatar ? (
                  <img src={post.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {post.user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <span className={`font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.user.name}</span>
                  {post.user.headline && (
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{post.user.headline}</span>
                  )}
                </div>
              </div>

              {/* Post content */}
              {post.content && (
                <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content}
                </p>
              )}

              {/* Media preview */}
              {post.media && post.media.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {post.media.slice(0, 4).map((m, idx) => (
                    <div key={m.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-700">
                      {m.type === 'VIDEO' ? (
                        <>
                          <img src={m.thumbnail || m.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <FiVideo className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <img src={m.url} alt={m.altText || ''} className="w-full h-full object-cover" />
                      )}
                      {idx === 3 && post.media!.length > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-medium text-sm">
                          +{post.media!.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              className={`w-full mb-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>

            {/* Comment input */}
            <div className="mb-4">
              <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Share to your timeline
              </label>
              <textarea
                value={shareComment}
                onChange={(e) => setShareComment(e.target.value)}
                placeholder="Add a comment to share with your followers..."
                className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-white placeholder-slate-400'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-all"
              >
                <FiShare2 className="w-4 h-4" />
                {isSharing ? 'Sharing...' : 'Share to Timeline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
