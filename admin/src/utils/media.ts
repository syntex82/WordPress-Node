/**
 * Media URL Utilities
 * Handles proper URL resolution for media files across different environments
 */

/**
 * Get the base URL for media files
 * In development, this points to the backend server
 * In production, media is served from the same origin
 */
export function getMediaBaseUrl(): string {
  // In development, Vite proxies /uploads to the backend
  // In production, media is served from the same origin
  // The Vite config should have a proxy for /uploads
  return '';
}

/**
 * Resolve a media path to a full URL
 * Handles both relative paths (/uploads/...) and absolute URLs (https://...)
 */
export function resolveMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Data URLs (base64)
  if (path.startsWith('data:')) {
    return path;
  }
  
  // Relative path - ensure it starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${getMediaBaseUrl()}${normalizedPath}`;
}

/**
 * Check if a URL is a video embed (YouTube, Vimeo)
 */
export function isVideoEmbed(url: string): boolean {
  if (!url) return false;
  return url.includes('youtube.com') || 
         url.includes('youtu.be') || 
         url.includes('vimeo.com');
}

/**
 * Get video type from URL
 */
export function getVideoType(url: string): 'youtube' | 'vimeo' | 'direct' | 'unknown' {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return 'direct';
  return 'unknown';
}

/**
 * Get YouTube video ID from URL
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : null;
}

/**
 * Get Vimeo video ID from URL
 */
export function getVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Get audio type from URL
 */
export function getAudioType(url: string): 'mp3' | 'wav' | 'ogg' | 'aac' | 'unknown' {
  if (!url) return 'unknown';
  if (url.match(/\.mp3$/i)) return 'mp3';
  if (url.match(/\.wav$/i)) return 'wav';
  if (url.match(/\.ogg$/i)) return 'ogg';
  if (url.match(/\.aac$/i) || url.match(/\.m4a$/i)) return 'aac';
  return 'unknown';
}

/**
 * Get MIME type for audio file
 */
export function getAudioMimeType(url: string): string {
  const type = getAudioType(url);
  switch (type) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'aac': return 'audio/aac';
    default: return 'audio/mpeg';
  }
}

/**
 * Validate media URL format
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for valid URL patterns
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Check for valid relative paths
  if (url.startsWith('/uploads/') || url.startsWith('/media/')) {
    return true;
  }
  
  return false;
}

/**
 * Get placeholder image for media type
 */
export function getMediaPlaceholder(type: 'image' | 'video' | 'audio'): string {
  switch (type) {
    case 'video':
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiI+PHBvbHlnb24gcG9pbnRzPSI1IDMgMTkgMTIgNSAyMSA1IDMiLz48L3N2Zz4=';
    case 'audio':
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iNS41IiBjeT0iMTcuNSIgcj0iMi41Ii8+PGNpcmNsZSBjeD0iMTguNSIgY3k9IjE1LjUiIHI9IjIuNSIvPjxwYXRoIGQ9Ik04IDE3VjVsMTMtMnYxMiIvPjwvc3ZnPg==';
    default:
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTUtNS00IDQtMi0yLTcgNyIvPjwvc3ZnPg==';
  }
}

