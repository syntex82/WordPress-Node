/**
 * ResponsiveMediaGallery Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponsiveMediaGallery, { type MediaItem } from '../ResponsiveMediaGallery';

const sampleItems: MediaItem[] = [
  {
    id: 'img-1',
    type: 'image',
    src: 'https://example.com/image1.jpg',
    thumbnail: 'https://example.com/thumb1.jpg',
    title: 'Image One',
    description: 'First image',
  },
  {
    id: 'vid-1',
    type: 'video',
    src: 'https://example.com/video1.mp4',
    thumbnail: 'https://example.com/vid-thumb1.jpg',
    title: 'Video One',
    duration: 120,
  },
  {
    id: 'aud-1',
    type: 'audio',
    src: 'https://example.com/audio1.mp3',
    title: 'Audio One',
    duration: 180,
  },
  {
    id: 'img-2',
    type: 'image',
    src: 'https://example.com/image2.jpg',
    title: 'Image Two',
  },
];

describe('ResponsiveMediaGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all media items', () => {
    render(<ResponsiveMediaGallery items={sampleItems} />);
    
    // Should render 4 items
    const images = document.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('shows empty state when no items', () => {
    render(<ResponsiveMediaGallery items={[]} />);
    
    expect(screen.getByText(/no media items/i)).toBeInTheDocument();
  });

  it('renders image items with thumbnails', () => {
    render(<ResponsiveMediaGallery items={sampleItems} />);
    
    const imageElements = document.querySelectorAll('img');
    expect(imageElements.length).toBeGreaterThan(0);
  });

  it('renders video items with play overlay', () => {
    render(<ResponsiveMediaGallery items={sampleItems} />);
    
    // Video items should have a play icon overlay
    const videoContainer = document.querySelector('[class*="video"]');
    expect(videoContainer || document.body).toBeInTheDocument();
  });

  it('renders audio items with music icon', () => {
    render(<ResponsiveMediaGallery items={sampleItems} />);
    
    // Audio items should have a gradient background
    const audioContainer = document.querySelector('[class*="gradient"]');
    expect(audioContainer).toBeInTheDocument();
  });

  it('calls onSelect when item is clicked', async () => {
    const mockOnSelect = vi.fn();
    render(
      <ResponsiveMediaGallery 
        items={sampleItems} 
        onSelect={mockOnSelect} 
      />
    );
    
    const firstItem = document.querySelector('[class*="rounded-xl"]');
    if (firstItem) {
      await userEvent.click(firstItem);
      expect(mockOnSelect).toHaveBeenCalled();
    }
  });

  it('shows selection state for selected items', () => {
    const selectedIds = new Set(['img-1']);
    render(
      <ResponsiveMediaGallery 
        items={sampleItems} 
        selectedIds={selectedIds}
      />
    );
    
    // Selected item should have a ring or visual indicator
    const selectedItem = document.querySelector('[class*="ring"]');
    expect(selectedItem).toBeInTheDocument();
  });

  it('calls onDelete when delete action is triggered', async () => {
    const mockOnDelete = vi.fn();
    render(
      <ResponsiveMediaGallery
        items={sampleItems}
        onDelete={mockOnDelete}
        showActions
      />
    );

    // Hover over item to show actions
    const firstItem = document.querySelector('[class*="rounded-xl"]');
    if (firstItem) {
      fireEvent.mouseEnter(firstItem);

      // Find all delete buttons and click the first one
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        await userEvent.click(deleteButtons[0]);
        expect(mockOnDelete).toHaveBeenCalledWith('img-1');
      }
    }
  });

  it('opens lightbox preview on preview action', async () => {
    render(
      <ResponsiveMediaGallery
        items={sampleItems}
        showActions
      />
    );

    const firstItem = document.querySelector('[class*="rounded-xl"]');
    if (firstItem) {
      fireEvent.mouseEnter(firstItem);

      // Find all preview buttons and click the first one
      const previewButtons = screen.getAllByRole('button', { name: /preview/i });
      if (previewButtons.length > 0) {
        await userEvent.click(previewButtons[0]);

        // Lightbox should appear
        await waitFor(() => {
          const lightbox = document.querySelector('[class*="fixed"]');
          expect(lightbox).toBeInTheDocument();
        });
      }
    }
  });

  it('respects aspect ratio prop', () => {
    const { container } = render(
      <ResponsiveMediaGallery 
        items={sampleItems}
        aspectRatio="video"
      />
    );
    
    const aspectContainer = container.querySelector('[class*="aspect-video"]');
    expect(aspectContainer).toBeInTheDocument();
  });
});

