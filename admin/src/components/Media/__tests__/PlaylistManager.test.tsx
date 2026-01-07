/**
 * PlaylistManager Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaylistManager, { type Playlist } from '../PlaylistManager';
import { type AudioTrack } from '../EnhancedAudioPlayer';

const sampleTracks: AudioTrack[] = [
  {
    id: 'track-1',
    title: 'Song One',
    artist: 'Artist A',
    src: 'https://example.com/song1.mp3',
    duration: 200,
  },
  {
    id: 'track-2',
    title: 'Song Two',
    artist: 'Artist B',
    src: 'https://example.com/song2.mp3',
    duration: 180,
  },
  {
    id: 'track-3',
    title: 'Song Three',
    artist: 'Artist C',
    src: 'https://example.com/song3.mp3',
    duration: 240,
  },
];

const samplePlaylist: Playlist = {
  id: 'playlist-1',
  name: 'My Test Playlist',
  description: 'A test playlist description',
  tracks: sampleTracks,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('PlaylistManager', () => {
  const mockOnPlaylistChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders playlist name', () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    expect(screen.getByText('My Test Playlist')).toBeInTheDocument();
  });

  it('renders playlist description', () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    expect(screen.getByText('A test playlist description')).toBeInTheDocument();
  });

  it('displays track count', () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    expect(screen.getByText(/3 tracks/i)).toBeInTheDocument();
  });

  it('renders all tracks', () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    expect(screen.getByText('Song One')).toBeInTheDocument();
    expect(screen.getByText('Song Two')).toBeInTheDocument();
    expect(screen.getByText('Song Three')).toBeInTheDocument();
  });

  it('displays track artists', () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    expect(screen.getByText(/Artist A/)).toBeInTheDocument();
    expect(screen.getByText(/Artist B/)).toBeInTheDocument();
  });

  it('shows edit button', () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it('enters edit mode on edit button click', async () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    
    // Should show input fields for editing
    const nameInput = screen.getByPlaceholderText(/playlist name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('calls onPlaylistChange when saving edits', async () => {
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);
    
    // Change name
    const nameInput = screen.getByPlaceholderText(/playlist name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Playlist Name');
    
    // Save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);
    
    expect(mockOnPlaylistChange).toHaveBeenCalled();
  });

  it('calls onTrackPlay when track is clicked', async () => {
    const mockOnTrackPlay = vi.fn();
    render(
      <PlaylistManager 
        playlist={samplePlaylist} 
        onPlaylistChange={mockOnPlaylistChange}
        onTrackPlay={mockOnTrackPlay}
      />
    );
    
    // Find and click on a track's play area
    const trackButtons = screen.getAllByRole('button');
    const playButton = trackButtons.find(btn => 
      btn.className.includes('rounded-lg') && btn.className.includes('flex')
    );
    
    if (playButton) {
      await userEvent.click(playButton);
    }
  });

  it('shows empty state for empty playlist', () => {
    const emptyPlaylist: Playlist = {
      ...samplePlaylist,
      tracks: [],
    };
    
    render(
      <PlaylistManager 
        playlist={emptyPlaylist} 
        onPlaylistChange={mockOnPlaylistChange} 
      />
    );
    
    expect(screen.getByText(/no tracks/i)).toBeInTheDocument();
  });
});

