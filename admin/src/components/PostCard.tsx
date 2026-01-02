/**
 * PostCard Component
 * Displays a rich timeline post with text, images, videos, and interactions
 * Supports hashtags, mentions, sharing, and real-time updates
 */

import { useState, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal, FiTrash2, FiPlay, FiRepeat, FiX } from 'react-icons/fi';
import { TimelinePost, timelineApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import PostMediaGallery from './PostMediaGallery';

interface PostCardProps {
  post: TimelinePost;
  onDelete?: (postId: string) => void;
  onCommentClick?: (postId: string) => void;
  onHashtagClick?: (tag: string) => void;
  onPostShared?: (post: TimelinePost) => void;
}

export default function PostCard({ post, onDelete, onCommentClick, onHashtagClick, onPostShared }: PostCardProps) {
  const { user: currentUser } = useAuthStore();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isOwner = currentUser?.id === post.user.id;
  const isSharedPost = !!post.originalPost;

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
            className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
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
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        return <span key={index} className="text-blue-600 dark:text-blue-400">{part}</span>;
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
  }, [post.mentions, onHashtagClick]);

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <PostMediaGallery
        media={post.media.map(m => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnail: m.thumbnail,
          altText: m.altText,
        }))}
        className="mt-3"
      />
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/admin/profile/${post.user.username || post.user.id}`}>
            {post.user.avatar ? (
              <img src={post.user.avatar} alt={post.user.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {post.user.name.charAt(0)}
              </div>
            )}
          </Link>
          <div>
            <Link
              to={`/admin/profile/${post.user.username || post.user.id}`}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {post.user.name}
            </Link>
            {post.user.headline && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{post.user.headline}</p>
            )}
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Menu */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FiMoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
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
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FiRepeat className="w-4 h-4" />
          <span>Shared a post</span>
        </div>
      )}

      {/* Share comment */}
      {post.shareComment && (
        <p className="mt-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {renderContent(post.shareComment)}
        </p>
      )}

      {/* Original post (for shares) */}
      {isSharedPost && post.originalPost && (
        <div className="mt-3 border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
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
                className="font-semibold text-sm text-gray-900 dark:text-white hover:underline"
              >
                {post.originalPost.user.name}
              </Link>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(post.originalPost.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {post.originalPost.content && (
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
              {post.originalPost.content}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      {post.content && !isSharedPost && (
        <p className="mt-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {renderContent(post.content)}
        </p>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-6 pt-3 border-t dark:border-gray-700">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </button>

        <button
          onClick={() => onCommentClick?.(post.id)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
        >
          <FiMessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentsCount}</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className={`flex items-center gap-2 transition-colors ${
            post.isShared ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <FiShare2 className="w-5 h-5" />
          <span className="text-sm">{sharesCount}</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Preview of post being shared */}
            <div className="border dark:border-gray-700 rounded-lg p-3 mb-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-2">
                {post.user.avatar ? (
                  <img src={post.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {post.user.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">{post.user.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {post.content || 'Shared a post'}
              </p>
            </div>

            {/* Comment input */}
            <textarea
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FiShare2 className="w-4 h-4" />
                {isSharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
