/**
 * Create Reel Page
 * Upload and publish short-form vertical videos
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reelsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import {
  FiUpload, FiX, FiPlay, FiPause, FiCheck, FiHash, FiGlobe, FiLock, FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreateReel() {
  const navigate = useNavigate();
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuthStore();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle video file selection
  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // Get video duration
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(Math.round(video.duration));
      if (video.duration > 60) {
        toast.error('Video must be 60 seconds or less');
        setVideoFile(null);
        setVideoPreview(null);
      }
    };
  }, []);

  // Handle thumbnail selection
  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }, []);

  // Toggle video playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  // Upload and create reel
  const handleSubmit = async () => {
    if (!videoFile) {
      toast.error('Please select a video');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const uploadRes = await reelsApi.uploadVideo(formData);
      setUploadProgress(50);

      // Create reel
      const hashtagList = hashtags
        .split(/[,\s#]+/)
        .filter(tag => tag.trim())
        .map(tag => tag.trim());

      await reelsApi.createReel({
        videoUrl: uploadRes.data.videoUrl,
        thumbnailUrl: uploadRes.data.thumbnailUrl || thumbnailPreview || undefined,
        caption: caption.trim() || undefined,
        duration,
        isPublic,
        hashtags: hashtagList.length > 0 ? hashtagList : undefined,
      });

      setUploadProgress(100);
      toast.success('Reel created successfully!');
      navigate('/reels');
    } catch (err: any) {
      console.error('Error creating reel:', err);
      toast.error(err.response?.data?.message || 'Failed to create reel');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Please log in to create reels</p>
          <Link to="/login" className="mt-4 inline-block px-6 py-2 bg-pink-500 text-white rounded-full">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Reel</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="flex flex-col items-center">
            {videoPreview ? (
              <div className="relative w-full max-w-[280px] aspect-[9/16] bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onClick={togglePlay}
                />
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                >
                  {playing ? <FiPause className="w-12 h-12 text-white" /> : <FiPlay className="w-12 h-12 text-white" />}
                </button>
                <button
                  onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm">
                  {duration}s
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-[280px] aspect-[9/16] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-colors ${
                  isDark ? 'border-slate-700 hover:border-pink-500 bg-slate-800/50' : 'border-gray-300 hover:border-pink-500 bg-gray-100'
                }`}
              >
                <FiUpload className={`w-12 h-12 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                <div className="text-center">
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Upload Video</p>
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>MP4, MOV, WebM • Max 60s</p>
                </div>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Caption */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                maxLength={2200}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl border resize-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{caption.length}/2200</p>
            </div>

            {/* Hashtags */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <FiHash className="inline w-4 h-4 mr-1" /> Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="dance, music, trending"
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Visibility</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    isPublic
                      ? 'bg-pink-500 border-pink-500 text-white'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  <FiGlobe className="w-5 h-5" /> Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                    !isPublic
                      ? 'bg-pink-500 border-pink-500 text-white'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  <FiLock className="w-5 h-5" /> Private
                </button>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Uploading...</span>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{uploadProgress}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
                  <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!videoFile || uploading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? 'Uploading...' : <><FiCheck className="w-5 h-5" /> Post Reel</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

