/**
 * Media Components Index
 * Export all media management components
 */

// Upload components
export { default as DragDropUploadZone } from './DragDropUploadZone';
export type { UploadFile, DragDropUploadZoneProps } from './DragDropUploadZone';

// Audio components
export { default as EnhancedAudioPlayer } from './EnhancedAudioPlayer';
export type { AudioTrack, PlayerSkin, EnhancedAudioPlayerProps } from './EnhancedAudioPlayer';

// Playlist components
export { default as PlaylistManager } from './PlaylistManager';
export type { Playlist } from './PlaylistManager';

// Re-export responsive gallery when created
export { default as ResponsiveMediaGallery } from './ResponsiveMediaGallery';
export type { MediaItem, ResponsiveMediaGalleryProps } from './ResponsiveMediaGallery';

