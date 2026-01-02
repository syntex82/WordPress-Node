/**
 * Comment Modal Component
 * Shows comments for a post and allows adding new comments
 */

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiX, FiSend, FiCornerDownRight } from 'react-icons/fi';
import { timelineApi, PostComment } from '../services/api';
import toast from 'react-hot-toast';

interface CommentModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function CommentModal({ postId, isOpen, onClose, onCommentAdded }: CommentModalProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, replyingTo]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={(id) => {
                  setReplyingTo(id);
                  inputRef.current?.focus();
                }}
              />
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
              <FiCornerDownRight className="w-4 h-4" />
              <span>Replying to comment</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-blue-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Individual Comment Item
function CommentItem({ comment, onReply }: { comment: PostComment; onReply: (id: string) => void }) {
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
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {comment.user.name}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
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
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {reply.user.name}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{reply.content}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
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

