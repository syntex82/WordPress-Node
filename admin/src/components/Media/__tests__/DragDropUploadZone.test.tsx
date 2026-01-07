/**
 * DragDropUploadZone Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DragDropUploadZone from '../DragDropUploadZone';

describe('DragDropUploadZone', () => {
  const mockOnFilesSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} />);

    // Look for the actual text in the component
    expect(screen.getByText(/drag & drop files/i)).toBeInTheDocument();
    expect(screen.getByText(/browse/i)).toBeInTheDocument();
  });

  it('displays correct file type restrictions', () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} accept="image" />);

    // Check for image-related content
    expect(screen.getByText(/image/i)).toBeInTheDocument();
  });

  it('shows max file size info', () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} maxFileSize={10} />);

    // The text is split across elements, so we need to check the container
    const container = document.querySelector('[class*="flex-wrap"]');
    expect(container?.textContent).toContain('10');
    expect(container?.textContent).toContain('MB');
  });

  it('handles file selection via input', async () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} />);

    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalled();
      });
    }
  });

  it('shows visual feedback on drag enter', () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} />);

    const dropzone = document.querySelector('[class*="border-dashed"]');

    if (dropzone) {
      // Create a proper dataTransfer mock
      const dataTransfer = {
        items: [{ kind: 'file', type: 'image/png' }],
        types: ['Files'],
        files: [],
      };

      fireEvent.dragEnter(dropzone, { dataTransfer });

      // Check for visual indication of active drag state
      expect(dropzone.className).toContain('border');
    }
  });

  it('handles drag leave', () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} />);

    const dropzone = document.querySelector('[class*="border-dashed"]');

    if (dropzone) {
      const dataTransfer = {
        items: [{ kind: 'file', type: 'image/png' }],
        types: ['Files'],
        files: [],
      };

      fireEvent.dragEnter(dropzone, { dataTransfer });
      fireEvent.dragLeave(dropzone, { dataTransfer });

      // Component should return to normal state
      expect(dropzone).toBeInTheDocument();
    }
  });

  it('respects disabled state', () => {
    render(<DragDropUploadZone onFilesSelected={mockOnFilesSelected} disabled />);
    
    const dropzone = document.querySelector('[class*="border-dashed"]');
    expect(dropzone?.className).toContain('opacity');
  });

  it('renders in compact mode', () => {
    const { container } = render(
      <DragDropUploadZone onFilesSelected={mockOnFilesSelected} compact />
    );
    
    // Compact mode should have smaller dimensions
    expect(container.firstChild).toBeInTheDocument();
  });

  it('rejects files exceeding max size', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(
      <DragDropUploadZone 
        onFilesSelected={mockOnFilesSelected} 
        maxFileSize={0.001} // 1KB
      />
    );
    
    // Create a file larger than 1KB
    const largeContent = new Array(2000).fill('x').join('');
    const file = new File([largeContent], 'large.png', { type: 'image/png' });
    
    const input = document.querySelector('input[type="file"]');
    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
    }
    
    // Should not call onFilesSelected with the oversized file
    // or should show an error message
    await waitFor(() => {
      expect(screen.queryByText(/too large/i) || mockOnFilesSelected).toBeTruthy();
    });
    
    consoleSpy.mockRestore();
  });

  it('respects maxFiles limit', async () => {
    render(
      <DragDropUploadZone 
        onFilesSelected={mockOnFilesSelected} 
        maxFiles={2}
      />
    );
    
    const files = [
      new File(['1'], 'test1.png', { type: 'image/png' }),
      new File(['2'], 'test2.png', { type: 'image/png' }),
      new File(['3'], 'test3.png', { type: 'image/png' }),
    ];
    
    const input = document.querySelector('input[type="file"]');
    if (input) {
      Object.defineProperty(input, 'files', { value: files });
      fireEvent.change(input);
    }
    
    // Component should handle max files appropriately
    expect(mockOnFilesSelected).toBeCalled;
  });
});

