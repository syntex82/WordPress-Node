/**
 * ShareModal Component
 * Modal for sharing posts with various options
 */

import { useState } from 'react';
import { FiX, FiCopy, FiTwitter, FiMessageCircle, FiMail, FiLink, FiCheck } from 'react-icons/fi';
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

  const shareOptions = [
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
      <div className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl p-6 pb-8
        ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Share Post</h3>
          <button onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <FiX className="w-6 h-6" />
          </button>
        </div>

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
        <div className="grid grid-cols-4 gap-4">
          {shareOptions.map(option => (
            <button key={option.id} onClick={option.onClick} disabled={isSharing}
              className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center
                group-hover:scale-110 transition-transform`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Post preview */}
        <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {post.content || 'No content'}
          </p>
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{postUrl}</p>
        </div>
      </div>
    </>
  );
}

