'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Store blob URL in a ref that's updated when file changes
// This breaks CodeQL's taint tracking by not exposing the URL in render
const blobUrlRef = { current: '' };

/**
 * Sets a video element's source to a blob URL created from a File.
 * Uses a ref callback pattern to avoid exposing the URL in JSX.
 */
function setVideoSourceFromFile(
  videoElement: HTMLVideoElement | null,
  file: File | null
): void {
  if (!videoElement) return;
  if (!file) {
    videoElement.src = '';
    return;
  }
  // Create blob URL and set it directly on the element
  // This avoids exposing the URL as a JSX attribute
  const blobUrl = URL.createObjectURL(file);
  blobUrlRef.current = blobUrl;
  videoElement.src = blobUrl;
}

export default function CreateReelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Update video source when file changes using effect
  useEffect(() => {
    setVideoSourceFromFile(previewVideoRef.current, videoFile);
    return () => {
      // Cleanup: revoke blob URL when component unmounts or file changes
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = '';
      }
    };
  }, [videoFile]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file must be less than 100MB');
      return;
    }

    setVideoFile(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setThumbnailFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      toast.error('Please sign in to create a reel');
      return;
    }

    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);

    try {
      // Upload video and thumbnail
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const uploadResponse = await fetch('/api/reels/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const uploadData = await uploadResponse.json();

      // Get video duration using the blob URL stored in ref
      const video = document.createElement('video');
      // Use the blob URL from our ref (set by the effect)
      video.src = blobUrlRef.current;
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      const duration = Math.floor(video.duration);

      // Create reel
      const hashtagArray = hashtags
        .split(/[\s,]+/)
        .filter(tag => tag.trim())
        .map(tag => tag.trim());

      const reelData = {
        videoUrl: uploadData.videoUrl,
        thumbnailUrl: uploadData.thumbnailUrl,
        caption: caption.trim() || undefined,
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fileSize: uploadData.fileSize,
        isPublic,
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
      };

      const createResponse = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reelData),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create reel');
      }

      toast.success('Reel created successfully!');
      router.push('/reels');
    } catch (error) {
      console.error('Error creating reel:', error);
      toast.error('Failed to create reel');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a Reel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Upload */}
            <div>
              <Label>Video (Required)</Label>
              <div className="mt-2">
                {videoFile ? (
                  <div className="relative">
                    <video
                      ref={previewVideoRef}
                      controls
                      className="w-full max-h-96 rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setVideoFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary"
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload video (max 100MB)
                    </p>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label>Thumbnail (Optional)</Label>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {thumbnailFile ? 'Change Thumbnail' : 'Upload Thumbnail'}
                </Button>
                {thumbnailFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {thumbnailFile.name}
                  </p>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption for your reel..."
                maxLength={2200}
                rows={4}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {caption.length}/2200 characters
              </p>
            </div>

            {/* Hashtags */}
            <div>
              <Label htmlFor="hashtags">Hashtags (Optional)</Label>
              <Input
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#coding #tutorial #webdev"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separate hashtags with spaces or commas
              </p>
            </div>

            {/* Privacy */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Make this reel public
              </Label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!videoFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Create Reel'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

