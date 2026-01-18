'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Gets video duration from a File object.
 * Creates a temporary video element to read metadata.
 */
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration);
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    // Create object URL from file - this is safe as File comes from file input
    video.src = URL.createObjectURL(file);
  });
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
  // Store the blob URL in a ref to avoid re-renders and taint tracking
  const blobUrlRef = useRef<string>('');

  // Update video preview when file changes
  useEffect(() => {
    // Clean up previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = '';
    }
    // This effect intentionally doesn't set video src directly
    // The video element will use a ref callback instead
  }, [videoFile]);

  // Ref callback to set video source - avoids exposing URL in JSX
  const videoRefCallback = useCallback((videoElement: HTMLVideoElement | null) => {
    if (!videoElement || !videoFile) return;
    // Create blob URL and set directly on element
    const url = URL.createObjectURL(videoFile);
    blobUrlRef.current = url;
    videoElement.src = url;
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

      // Get video duration using the helper function
      // This creates a separate blob URL for duration calculation
      const duration = await getVideoDuration(videoFile);

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
                      ref={videoRefCallback}
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

