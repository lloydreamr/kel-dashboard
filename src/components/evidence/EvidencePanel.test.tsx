import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { EvidencePanel } from './EvidencePanel';

import type { Evidence } from '@/types/evidence';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock next/image - filter out Next.js-specific props that aren't valid HTML attributes
vi.mock('next/image', () => ({
  default: ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unoptimized, priority, fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean; priority?: boolean; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} />
  ),
}));

const mockEvidence: Evidence = {
  id: 'e1',
  question_id: 'q1',
  title: 'Market Research Report',
  url: 'https://example.com/report',
  section_anchor: '#pricing',
  excerpt: 'This report shows pricing trends in the market.',
  created_by: 'user1',
  created_at: '2024-12-24T00:00:00Z',
};

describe('EvidencePanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders evidence details when evidence is provided', () => {
    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    expect(screen.getByTestId('evidence-panel')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-panel-title')).toHaveTextContent(
      'Market Research Report'
    );
    expect(screen.getByTestId('evidence-panel-domain')).toHaveTextContent(
      'example.com'
    );
    expect(screen.getByTestId('evidence-panel-url')).toHaveTextContent(
      'https://example.com/report#pricing'
    );
    expect(screen.getByTestId('evidence-panel-excerpt')).toHaveTextContent(
      'This report shows pricing trends'
    );
  });

  it('renders null when evidence is null', () => {
    const { container } = render(
      <EvidencePanel evidence={null} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders without excerpt when not provided', () => {
    const evidenceNoExcerpt = { ...mockEvidence, excerpt: null };
    render(<EvidencePanel evidence={evidenceNoExcerpt} onClose={mockOnClose} />);

    expect(screen.queryByTestId('evidence-panel-excerpt')).not.toBeInTheDocument();
  });

  it('opens source in new tab when Open Source button clicked', async () => {
    const user = userEvent.setup();
    const mockOpen = vi.fn();
    vi.stubGlobal('open', mockOpen);

    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    await user.click(screen.getByTestId('evidence-panel-open-source'));

    expect(mockOpen).toHaveBeenCalledWith(
      'https://example.com/report#pricing',
      '_blank',
      'noopener,noreferrer'
    );

    vi.unstubAllGlobals();
  });

  it('copies URL to clipboard when Copy button clicked', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith(
      'https://example.com/report#pricing'
    );
  });

  it('shows checkmark after URL is copied', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toHaveTextContent('Copy');

    await user.click(copyButton);

    expect(copyButton).toHaveTextContent('✓');
  });

  it('shows section anchor when provided', () => {
    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    // Check for Section label specifically in the section anchor display
    const sectionLabel = screen.getByText(/Section:/);
    expect(sectionLabel).toBeInTheDocument();
    expect(sectionLabel.parentElement).toHaveTextContent('pricing');
  });

  it('does not show section anchor when not provided', () => {
    const evidenceNoAnchor = { ...mockEvidence, section_anchor: null };
    render(<EvidencePanel evidence={evidenceNoAnchor} onClose={mockOnClose} />);

    expect(screen.queryByText(/Section:/)).not.toBeInTheDocument();
  });

  it('has accessible Open Source button with 48px touch target', () => {
    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const button = screen.getByTestId('evidence-panel-open-source');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('has responsive width classes for different screen sizes', () => {
    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const panel = screen.getByTestId('evidence-panel');
    expect(panel).toHaveClass('w-full');
    expect(panel).toHaveClass('sm:w-[60%]');
    expect(panel).toHaveClass('lg:w-[50%]');
    expect(panel).toHaveClass('lg:max-w-[540px]');
  });

  it('has sage-colored header', () => {
    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const header = screen.getByTestId('evidence-panel-header');
    expect(header).toHaveClass('bg-green-50/50');
  });

  it('builds full URL with section anchor correctly', () => {
    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const urlElement = screen.getByTestId('evidence-panel-url');
    expect(urlElement).toHaveTextContent('https://example.com/report#pricing');
  });

  it('builds URL without anchor when section_anchor is null', () => {
    const evidenceNoAnchor = { ...mockEvidence, section_anchor: null };
    render(<EvidencePanel evidence={evidenceNoAnchor} onClose={mockOnClose} />);

    const urlElement = screen.getByTestId('evidence-panel-url');
    expect(urlElement).toHaveTextContent('https://example.com/report');
    expect(urlElement).not.toHaveTextContent('#');
  });

  it('shows error toast when copy fails', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Copy failed'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(<EvidencePanel evidence={mockEvidence} onClose={mockOnClose} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(toast.error).toHaveBeenCalledWith('Failed to copy URL to clipboard');
  });
});
