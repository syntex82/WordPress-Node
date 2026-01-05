/**
 * ShareModal Component
 * Modal for sharing posts with various options including share to timeline
 */

import { useState } from 'react';
import { FiX, FiCopy, FiTwitter, FiMessageCircle, FiMail, FiLink, FiCheck, FiShare2, FiVideo } from 'react-icons/fi';
import { TimelinePost, timelineApi } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: TimelinePost;
  onShared?: () => void;
}

export default function ShareModal({ isOpen, onClose, post, onShared }: ShareModalProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [showTimelineShare, setShowTimelineShare] = useState(false);

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const shareText = post.content?.slice(0, 100) || 'Check out this post!';

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

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    try {
      // Record the share
      await timelineApi.sharePost(post.id);
      onShared?.();

      // Open share URL
      let shareUrl = '';
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(`${shareText}\n\n${postUrl}`)}`;
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      }
      onClose();
    } catch {
      toast.error('Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          text: shareText,
          url: postUrl,
        });
        await timelineApi.sharePost(post.id);
        onShared?.();
        onClose();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
  };

  const handleShareToTimeline = async () => {
    setIsSharing(true);
    try {
      await timelineApi.sharePost(post.id, shareComment.trim() || undefined);
      onShared?.();
      toast.success('Shared to your timeline!');
      setShareComment('');
      setShowTimelineShare(false);
      onClose();
    } catch {
      toast.error('Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const shareOptions = [
    { id: 'timeline', icon: FiShare2, label: 'Timeline', onClick: () => setShowTimelineShare(true), color: 'bg-gradient-to-r from-green-500 to-emerald-600' },
    { id: 'copy', icon: copied ? FiCheck : FiCopy, label: copied ? 'Copied!' : 'Copy Link', onClick: handleCopyLink, color: 'bg-gray-500' },
    { id: 'twitter', icon: FiTwitter, label: 'Twitter', onClick: () => handleShare('twitter'), color: 'bg-blue-400' },
    { id: 'whatsapp', icon: FiMessageCircle, label: 'WhatsApp', onClick: () => handleShare('whatsapp'), color: 'bg-green-500' },
    { id: 'email', icon: FiMail, label: 'Email', onClick: () => handleShare('email'), color: 'bg-red-500' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[90vh] overflow-y-auto
        ${isDark ? 'bg-gray-900' : 'bg-white'}`}>

        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {showTimelineShare ? 'Share to Timeline' : 'Share Post'}
          </h3>
          <button onClick={() => showTimelineShare ? setShowTimelineShare(false) : onClose()}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {showTimelineShare ? (
          /* Share to Timeline UI */
          <>
            {/* Full post preview */}
            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
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
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{post.user.headline}</span>
                  )}
                </div>
              </div>
              {post.content && (
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {post.content.length > 150 ? `${post.content.slice(0, 150)}...` : post.content}
                </p>
              )}
              {post.media && post.media.length > 0 && (
                <div className="flex gap-2">
                  {post.media.slice(0, 3).map((m, idx) => (
                    <div key={m.id} className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-700">
                      {m.type === 'VIDEO' ? (
                        <>
                          <img src={m.thumbnail || m.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <FiVideo className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                      {idx === 2 && post.media!.length > 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs font-medium">
                          +{post.media!.length - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment input */}
            <textarea
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              placeholder="Add a comment to share with your followers..."
              className={`w-full p-3 border rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4 ${
                isDark
                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              }`}
              rows={3}
            />

            <button
              onClick={handleShareToTimeline}
              disabled={isSharing}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
            >
              <FiShare2 className="w-5 h-5" />
              {isSharing ? 'Sharing...' : 'Share to Timeline'}
            </button>
          </>
        ) : (
          /* Share options */
          <>
            {/* Native share button (if available) */}
            {navigator.share && (
              <button onClick={handleNativeShare} disabled={isSharing}
                className={`w-full mb-6 py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors
                  ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                <FiLink className="w-5 h-5" />
                Share via...
              </button>
            )}

            {/* Share options grid */}
            <div className="grid grid-cols-5 gap-3">
              {shareOptions.map(option => (
                <button key={option.id} onClick={option.onClick} disabled={isSharing}
                  className="flex flex-col items-center gap-2 group">
                  <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center
                    group-hover:scale-110 transition-transform`}>
                    <option.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Post preview */}
            <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                {post.user.avatar ? (
                  <img src={post.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {post.user.name.charAt(0)}
                  </div>
                )}
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.user.name}</span>
              </div>
              <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {post.content || 'No content'}
              </p>
              {post.media && post.media.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {post.media.slice(0, 4).map((m) => (
                    <div key={m.id} className="w-10 h-10 rounded overflow-hidden bg-gray-700">
                      <img src={m.type === 'VIDEO' ? (m.thumbnail || m.url) : m.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {post.media.length > 4 && (
                    <span className={`text-xs self-center ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>+{post.media.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

