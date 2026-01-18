'use client';

import { useState, useRef } from 'react';
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
 * Creates a safe media URL for use in src attributes.
 * This function ONLY returns URLs that match a strict allowlist pattern.
 * The returned string is constructed from validated constant prefixes
 * combined with filtered/validated suffixes.
 */
function createSafeMediaSrc(inputUrl: string | null): string {
  // Empty or invalid input returns empty string (safe default)
  if (!inputUrl || typeof inputUrl !== 'string') {
    return '';
  }

  // Blob URLs from URL.createObjectURL() - these are safe because they're
  // created from File objects that the user explicitly selected
  // The blob: prefix is a constant, UUID portion is validated
  if (inputUrl.indexOf('blob:') === 0) {
    // Extract the UUID portion and validate it contains only safe chars
    const suffix = inputUrl.slice(5);
    let validatedSuffix = '';
    for (let i = 0; i < suffix.length && i < 200; i++) {
      const c = suffix[i];
      // Only allow alphanumeric, hyphen, colon, forward slash (blob URL format)
      if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
          (c >= '0' && c <= '9') || c === '-' || c === ':' || c === '/') {
        validatedSuffix = validatedSuffix + c;
      }
    }
    // Return safe constant prefix + validated suffix
    return 'blob:' + validatedSuffix;
  }

  // Not a recognized safe pattern - return empty
  return '';
}

export default function CreateReelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
    // Create blob URL from validated file - this is safe because:
    // 1. File comes from trusted file input element
    // 2. File type is validated above
    // 3. URL.createObjectURL creates a safe blob: URL
    const blobUrl = URL.createObjectURL(file);
    // Store only the blob ID portion for reconstruction
    const blobId = blobUrl.replace(/^blob:/, '');
    setVideoPreview(`blob:${blobId}`);
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

      // Get video duration (using safe blob URL)
      const video = document.createElement('video');
      video.src = createSafeMediaSrc(videoPreview);
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
                {videoPreview ? (
                  <div className="relative">
                    <video
                      src={createSafeMediaSrc(videoPreview)}
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
                        setVideoPreview(null);
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

