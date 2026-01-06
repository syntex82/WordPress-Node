/**
 * CreatePostForm Component
 * Form for creating new timeline posts with text and media
 * Includes @mention autocomplete and #hashtag highlighting
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { FiImage, FiVideo, FiX, FiGlobe, FiLock, FiHash, FiAtSign, FiLink, FiPlay, FiFolder, FiMic, FiMonitor } from 'react-icons/fi';
import { timelineApi, mediaApi, CreatePostMediaDto, TimelinePostUser } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';
import EmojiPicker from './EmojiPicker';
import MediaLibraryPicker from './MediaLibraryPicker';
import MobileMediaRecorder from './MobileMediaRecorder';

type RecordingMode = 'video' | 'audio' | 'screen';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [media, setMedia] = useState<CreatePostMediaDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<TimelinePostUser[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);

  // Media library and URL input state
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mobile media recorder state
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);
  const [showRecordingModeMenu, setShowRecordingModeMenu] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('video');
  const recordingMenuRef = useRef<HTMLDivElement>(null);

  // Close recording mode menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recordingMenuRef.current && !recordingMenuRef.current.contains(event.target as Node)) {
        setShowRecordingModeMenu(false);
      }
    };
    if (showRecordingModeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRecordingModeMenu]);

  // Debounced search for mention suggestions
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setMentionSuggestions([]);
      setShowMentionDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingMentions(true);
      try {
        const res = await timelineApi.searchUsersForMention(mentionQuery);
        setMentionSuggestions(res.data);
        setShowMentionDropdown(res.data.length > 0);
        setSelectedSuggestionIndex(0);
      } catch {
        console.error('Error searching mentions');
      } finally {
        setIsLoadingMentions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);

    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionStartIndex(textBeforeCursor.length - mentionMatch[0].length);
    } else {
      setMentionQuery('');
      setShowMentionDropdown(false);
    }
  }, []);

  const insertMention = useCallback((user: TimelinePostUser) => {
    if (mentionStartIndex < 0) return;

    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(mentionStartIndex + mentionQuery.length + 1); // +1 for @
    const newContent = `${before}@${user.username || user.name} ${after}`;

    setContent(newContent);
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = before.length + (user.username || user.name).length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [content, mentionQuery, mentionStartIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown || mentionSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < mentionSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : mentionSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && showMentionDropdown) {
      e.preventDefault();
      insertMention(mentionSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentionDropdown(false);
    }
  }, [showMentionDropdown, mentionSuggestions, selectedSuggestionIndex, insertMention]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limit to 4 media items
    const remaining = 4 - media.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error('Only images and videos are supported');
          continue;
        }

        // Upload to server
        const res = await mediaApi.upload(file, (progress) => {
          setUploadProgress(Math.round((i / filesToProcess.length) * 100 + progress / filesToProcess.length));
        });

        const uploadedUrl = res.data.url || res.data.path;
        setPreviewUrls((prev) => [...prev, uploadedUrl]);

        const mediaItem: CreatePostMediaDto = {
          type: isVideo ? 'VIDEO' : 'IMAGE',
          url: uploadedUrl,
        };

        setMedia((prev) => [...prev, mediaItem]);
      }
    } catch {
      toast.error('Failed to upload media');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const newContent = content.slice(0, cursorPos) + emoji + content.slice(cursorPos);
    setContent(newContent);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + emoji.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Handle media library selection
  const handleMediaLibrarySelect = (items: any[]) => {
    const remaining = 4 - media.length;
    const itemsToAdd = items.slice(0, remaining);

    for (const item of itemsToAdd) {
      const url = item.path || item.url;
      // Check mimeType or file extension for video detection
      const isVideo = item.mimeType?.startsWith('video/') ||
        /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(url);
      console.log('Media library item:', { url, mimeType: item.mimeType, isVideo });
      setPreviewUrls((prev) => [...prev, url]);
      setMedia((prev) => [...prev, { type: isVideo ? 'VIDEO' : 'IMAGE', url }]);
    }
  };

  // Handle recorded media from MobileMediaRecorder (already uploaded by the component)
  const handleMediaCaptured = (capturedMedia: { type: 'VIDEO' | 'AUDIO'; url: string; thumbnail?: string }) => {
    if (media.length >= 4) {
      toast.error('Maximum 4 media items allowed');
      return;
    }

    // Treat audio as video for media type (audio files are stored as VIDEO type)
    const mediaType: 'VIDEO' | 'IMAGE' | 'GIF' = 'VIDEO';
    setPreviewUrls((prev) => [...prev, capturedMedia.url]);
    setMedia((prev) => [...prev, { type: mediaType, url: capturedMedia.url, thumbnail: capturedMedia.thumbnail }]);
    setShowMediaRecorder(false);
    toast.success(`${capturedMedia.type === 'VIDEO' ? 'Video' : 'Audio'} added to post!`);
  };

  // Handle external URL input
  const handleAddExternalUrl = async () => {
    if (!externalUrl.trim()) return;

    const url = externalUrl.trim();
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isVimeo = url.includes('vimeo.com');
    const isDirectImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    const isDirectVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
    const isVideoEmbed = isYouTube || isVimeo;

    if (media.length >= 4) {
      toast.error('Maximum 4 media items allowed');
      return;
    }

    // Handle direct media URLs
    if (isDirectImage) {
      setPreviewUrls((prev) => [...prev, url]);
      setMedia((prev) => [...prev, { type: 'IMAGE', url }]);
      setExternalUrl('');
      setShowUrlInput(false);
      return;
    }

    if (isDirectVideo || isVideoEmbed) {
      setPreviewUrls((prev) => [...prev, url]);
      setMedia((prev) => [...prev, { type: 'VIDEO', url }]);
      setExternalUrl('');
      setShowUrlInput(false);
      return;
    }

    // For other URLs, fetch link preview
    try {
      const loadingToast = toast.loading('Fetching link preview...');
      const preview = await timelineApi.fetchUrlPreview(url);
      toast.dismiss(loadingToast);

      setPreviewUrls((prev) => [...prev, url]);
      setMedia((prev) => [...prev, {
        type: 'LINK',
        url,
        thumbnail: preview.data.image,
        linkTitle: preview.data.title,
        linkDescription: preview.data.description,
        linkSiteName: preview.data.siteName,
      }]);
      setExternalUrl('');
      setShowUrlInput(false);
    } catch {
      toast.error('Failed to fetch link preview');
      // Add as simple link anyway
      setPreviewUrls((prev) => [...prev, url]);
      setMedia((prev) => [...prev, { type: 'LINK', url }]);
      setExternalUrl('');
      setShowUrlInput(false);
    }
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      toast.error('Please add some content or media');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        content: content.trim() || undefined,
        isPublic,
        media: media.length > 0 ? media : undefined,
      };
      console.log('Creating post with data:', postData);
      await timelineApi.createPost(postData);
      toast.success('Post created!');
      setContent('');
      setMedia([]);
      setPreviewUrls([]);
      onPostCreated?.();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create post';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`backdrop-blur rounded-xl border p-3 sm:p-4 mb-4 sm:mb-6 ${
      isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="flex gap-2 sm:gap-3">
        {/* User Avatar */}
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}

        {/* Input Area */}
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            className={`w-full resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-sm sm:text-base ${
              isDark ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400'
            }`}
            rows={2}
          />

          {/* Mention Autocomplete Dropdown */}
          {showMentionDropdown && (
            <div className={`absolute left-0 right-0 mt-1 rounded-lg shadow-lg border max-h-48 overflow-y-auto z-20 ${
              isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
            }`}>
              {isLoadingMentions ? (
                <div className={`px-3 py-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Searching...
                </div>
              ) : mentionSuggestions.length === 0 ? (
                <div className={`px-3 py-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  No users found
                </div>
              ) : (
                mentionSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => insertMention(suggestion)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left ${
                      isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-100'
                    } ${index === selectedSuggestionIndex ? 'bg-blue-600/30' : ''}`}
                  >
                    {suggestion.avatar ? (
                      <img src={suggestion.avatar} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                        {suggestion.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {suggestion.name}
                      </div>
                      {suggestion.username && (
                        <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          @{suggestion.username}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className={`mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-xs sm:text-sm text-blue-500 whitespace-nowrap">{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* External URL Input */}
          {showUrlInput && (
            <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="Paste URL..."
                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExternalUrl()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddExternalUrl}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowUrlInput(false); setExternalUrl(''); }}
                  className={`p-2 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-600' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Media Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
              {previewUrls.map((url, index) => {
                const mediaItem = media[index];
                const isLink = mediaItem?.type === 'LINK';
                const isVideo = mediaItem?.type === 'VIDEO';
                const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                const isVimeo = url.includes('vimeo.com');
                const isExternalVideo = isYouTube || isVimeo;

                return (
                  <div key={index} className={`relative ${isLink ? '' : 'aspect-square'} rounded-lg overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    {isLink ? (
                      // Link preview card
                      <div className="p-2 sm:p-3">
                        {mediaItem.thumbnail && (
                          <img src={mediaItem.thumbnail} alt="" className="w-full h-20 sm:h-24 object-cover rounded mb-2" />
                        )}
                        <div className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                          {mediaItem.linkTitle || new URL(url).hostname}
                        </div>
                        {mediaItem.linkDescription && (
                          <div className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {mediaItem.linkDescription}
                          </div>
                        )}
                        <div className={`text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          <FiLink className="w-3 h-3" />
                          {mediaItem.linkSiteName || new URL(url).hostname}
                        </div>
                      </div>
                    ) : isExternalVideo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
                        <FiPlay className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mb-1 sm:mb-2" />
                        <span className={`text-xs text-center truncate w-full ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {isYouTube ? 'YouTube' : 'Vimeo'}
                        </span>
                      </div>
                    ) : isVideo ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {isVideo && !isExternalVideo && (
                      <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/70 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                        Video
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between sm:justify-start gap-0.5 sm:gap-1 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload from device */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={media.length >= 4 || isUploading}
                className={`p-1.5 sm:p-2 rounded-full disabled:opacity-50 transition-colors touch-manipulation ${
                  isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Upload from device"
              >
                <FiImage className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Video from device */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={media.length >= 4 || isUploading}
                className={`p-1.5 sm:p-2 rounded-full disabled:opacity-50 transition-colors touch-manipulation hidden sm:block ${
                  isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Upload video"
              >
                <FiVideo className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Media Library */}
              <button
                onClick={() => setShowMediaLibrary(true)}
                disabled={media.length >= 4}
                className={`p-1.5 sm:p-2 rounded-full disabled:opacity-50 transition-colors touch-manipulation ${
                  isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Choose from media library"
              >
                <FiFolder className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Record Video/Audio/Screen - Dropdown Menu */}
              <div className="relative" ref={recordingMenuRef}>
                <button
                  onClick={() => setShowRecordingModeMenu(!showRecordingModeMenu)}
                  disabled={media.length >= 4 || isUploading}
                  className={`p-1.5 sm:p-2 rounded-full disabled:opacity-50 transition-colors touch-manipulation ${
                    showRecordingModeMenu
                      ? 'text-purple-400 bg-purple-900/30'
                      : isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Record video, audio, or screen"
                >
                  <FiMic className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Recording Mode Dropdown */}
                {showRecordingModeMenu && (
                  <div className={`absolute bottom-full left-0 mb-2 py-2 rounded-xl shadow-xl border z-50 min-w-[160px] ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    <button
                      onClick={() => { setRecordingMode('video'); setShowRecordingModeMenu(false); setShowMediaRecorder(true); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <FiVideo className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">Record Video</span>
                    </button>
                    <button
                      onClick={() => { setRecordingMode('audio'); setShowRecordingModeMenu(false); setShowMediaRecorder(true); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <FiMic className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">Record Audio</span>
                    </button>
                    <button
                      onClick={() => { setRecordingMode('screen'); setShowRecordingModeMenu(false); setShowMediaRecorder(true); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <FiMonitor className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium">Screen Recording</span>
                    </button>
                  </div>
                )}
              </div>

              {/* External URL */}
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                disabled={media.length >= 4}
                className={`p-1.5 sm:p-2 rounded-full disabled:opacity-50 transition-colors touch-manipulation ${
                  showUrlInput
                    ? 'text-blue-400 bg-blue-900/30'
                    : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Add URL"
              >
                <FiLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Emoji Picker */}
              <EmojiPicker onSelect={handleEmojiSelect} />

              {/* Divider - hidden on mobile */}
              <div className={`hidden sm:block w-px h-5 mx-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />

              {/* Visibility Toggle */}
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors touch-manipulation ${
                  isPublic
                    ? 'bg-green-900/30 text-green-400'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isPublic ? <FiGlobe className="w-3 h-3 sm:w-4 sm:h-4" /> : <FiLock className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{isPublic ? 'Public' : 'Private'}</span>
              </button>

              {/* Media count indicator */}
              {media.length > 0 && (
                <span className={`text-xs ml-1 sm:ml-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {media.length}/4
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading || (!content.trim() && media.length === 0)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg sm:rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-sm sm:text-base"
            >
              {isSubmitting ? 'Posting...' : isUploading ? 'Uploading...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryPicker
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaLibrarySelect}
        multiple={true}
        accept="all"
      />

      {/* Mobile Media Recorder Modal */}
      <MobileMediaRecorder
        isOpen={showMediaRecorder}
        onClose={() => setShowMediaRecorder(false)}
        onMediaCaptured={handleMediaCaptured}
        mode={recordingMode}
      />
    </div>
  );
}
