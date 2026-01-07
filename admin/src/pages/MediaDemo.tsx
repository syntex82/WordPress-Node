/**
 * Media Components Demo Page
 * Showcases all media management components
 */

import { useState } from 'react';
import {
  DragDropUploadZone,
  EnhancedAudioPlayer,
  PlaylistManager,
  ResponsiveMediaGallery,
  type UploadFile,
  type AudioTrack,
  type Playlist,
  type MediaItem,
  type PlayerSkin,
} from '../components/Media';

// Sample audio tracks
const sampleTracks: AudioTrack[] = [
  {
    id: '1',
    title: 'Summer Vibes',
    artist: 'Chill Beats',
    album: 'Relaxation',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 180,
  },
  {
    id: '2',
    title: 'Night Drive',
    artist: 'Synthwave Dreams',
    album: 'Neon Nights',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 240,
  },
  {
    id: '3',
    title: 'Morning Coffee',
    artist: 'Jazz Collective',
    album: 'Cafe Sessions',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 195,
  },
];

// Sample playlist
const samplePlaylist: Playlist = {
  id: 'playlist-1',
  name: 'My Favorites',
  description: 'A collection of my favorite tracks',
  tracks: sampleTracks,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample media items for gallery
const sampleMediaItems: MediaItem[] = [
  { id: 'm1', type: 'image', src: 'https://picsum.photos/400/400?random=1', title: 'Mountain View' },
  { id: 'm2', type: 'image', src: 'https://picsum.photos/400/400?random=2', title: 'Ocean Sunset' },
  { id: 'm3', type: 'video', src: 'https://example.com/video.mp4', thumbnail: 'https://picsum.photos/400/400?random=3', title: 'Beach Waves', duration: 120 },
  { id: 'm4', type: 'image', src: 'https://picsum.photos/400/400?random=4', title: 'Forest Path' },
  { id: 'm5', type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', title: 'Ambient Music', duration: 180 },
  { id: 'm6', type: 'image', src: 'https://picsum.photos/400/400?random=5', title: 'City Lights' },
];

export default function MediaDemo() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [playlist, setPlaylist] = useState<Playlist>(samplePlaylist);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(sampleMediaItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [playerSkin, setPlayerSkin] = useState<PlayerSkin>('modern');

  const handleFilesSelected = (files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleMediaSelect = (item: MediaItem) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Media Components Demo
          </h1>
          <p className="text-slate-400 text-lg">
            Drag-and-drop uploads, audio players, playlists, and responsive galleries
          </p>
        </header>

        {/* Upload Zone Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-sm">1</span>
            Drag & Drop Upload Zone
          </h2>
          <DragDropUploadZone
            onFilesSelected={handleFilesSelected}
            accept="all"
            maxFiles={10}
            maxFileSize={50}
          />
        </section>

        {/* Audio Player Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-sm">2</span>
            Enhanced Audio Player
          </h2>
          
          {/* Skin selector */}
          <div className="flex gap-2 mb-4">
            {(['modern', 'neon', 'retro', 'minimal', 'glassmorphic'] as const).map(skin => (
              <button
                key={skin}
                onClick={() => setPlayerSkin(skin as PlayerSkin)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  playerSkin === skin 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {skin}
              </button>
            ))}
          </div>

          <EnhancedAudioPlayer
            tracks={sampleTracks}
            skin={playerSkin}
            showVisualization
            showVinylAnimation
          />
        </section>

        {/* Playlist Manager Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-sm">3</span>
            Playlist Manager (Drag to Reorder)
          </h2>
          <PlaylistManager
            playlist={playlist}
            onPlaylistChange={setPlaylist}
          />
        </section>

        {/* Media Gallery Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm">4</span>
            Responsive Media Gallery
          </h2>
          <p className="text-slate-400 mb-4">
            Click to select, drag to reorder. Selected: {selectedIds.size} items
          </p>
          <ResponsiveMediaGallery
            items={mediaItems}
            onReorder={setMediaItems}
            onSelect={handleMediaSelect}
            selectedIds={selectedIds}
            onDelete={(id) => setMediaItems(prev => prev.filter(i => i.id !== id))}
            columns={{ sm: 2, md: 3, lg: 4, xl: 5 }}
            aspectRatio="square"
          />
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-800">
          <p className="text-slate-500">
            All components are fully responsive and touch-friendly
          </p>
        </footer>
      </div>
    </div>
  );
}

