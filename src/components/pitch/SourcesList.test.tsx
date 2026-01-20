import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SourcesList } from './SourcesList';

import type { PitchSourceType } from '@/types/pitch';

function createSource(overrides: Partial<{
  id: string;
  source_type: PitchSourceType;
  source_id: string;
  relevance_score: number | null;
  source_name?: string;
}> = {}) {
  return {
    id: 'src-1',
    source_type: 'companies' as PitchSourceType,
    source_id: 'c1',
    relevance_score: 0.9,
    ...overrides,
  };
}

describe('SourcesList', () => {
  describe('rendering', () => {
    it('renders nothing when sources array is empty', () => {
      const { container } = render(<SourcesList sources={[]} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('renders sources list with count', () => {
      const sources = [
        createSource({ id: 'src-1', source_type: 'companies' }),
        createSource({ id: 'src-2', source_type: 'trends' }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.getByText('Sources (2)')).toBeInTheDocument();
      expect(screen.getByTestId('sources-list')).toBeInTheDocument();
    });

    it('renders source type badges', () => {
      const sources = [
        createSource({ id: 'src-1', source_type: 'companies' }),
        createSource({ id: 'src-2', source_type: 'products' }),
        createSource({ id: 'src-3', source_type: 'trends' }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.getByTestId('source-companies')).toBeInTheDocument();
      expect(screen.getByTestId('source-products')).toBeInTheDocument();
      expect(screen.getByTestId('source-trends')).toBeInTheDocument();
    });
  });

  describe('source types', () => {
    it.each([
      ['companies', 'Company'],
      ['products', 'Product'],
      ['consumers', 'Consumer Segment'],
      ['trends', 'Trend'],
      ['research_docs', 'Research Document'],
    ] as const)('displays %s source with correct label', (sourceType, expectedLabel) => {
      const sources = [createSource({ source_type: sourceType })];

      render(<SourcesList sources={sources} />);

      const badge = screen.getByTestId(`source-${sourceType}`);
      expect(badge).toHaveTextContent(expectedLabel);
    });
  });

  describe('source name', () => {
    it('displays source_name when provided', () => {
      const sources = [
        createSource({ source_name: 'URC Corporation' }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.getByText('URC Corporation')).toBeInTheDocument();
    });

    it('falls back to type label when source_name is not provided', () => {
      const sources = [
        createSource({ source_type: 'companies', source_name: undefined }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.getByText('Company')).toBeInTheDocument();
    });
  });

  describe('relevance score', () => {
    it('displays relevance score as percentage', () => {
      const sources = [
        createSource({ relevance_score: 0.85 }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('does not display score when null', () => {
      const sources = [
        createSource({ relevance_score: null }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('rounds relevance score correctly', () => {
      const sources = [
        createSource({ relevance_score: 0.876 }),
      ];

      render(<SourcesList sources={sources} />);

      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });

  describe('maxVisible limit', () => {
    it('shows all sources when count is within limit', () => {
      const sources = [
        createSource({ id: 'src-1' }),
        createSource({ id: 'src-2' }),
        createSource({ id: 'src-3' }),
      ];

      render(<SourcesList sources={sources} maxVisible={5} />);

      const list = screen.getByTestId('sources-list');
      // Should show all 3 sources, no "+X more"
      expect(list.children).toHaveLength(3);
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('shows "+X more" when sources exceed maxVisible', () => {
      const sources = Array.from({ length: 7 }, (_, i) =>
        createSource({ id: `src-${i}` })
      );

      render(<SourcesList sources={sources} maxVisible={5} />);

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('uses default maxVisible of 5', () => {
      const sources = Array.from({ length: 8 }, (_, i) =>
        createSource({ id: `src-${i}` })
      );

      render(<SourcesList sources={sources} />);

      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('shows correct count with custom maxVisible', () => {
      const sources = Array.from({ length: 10 }, (_, i) =>
        createSource({ id: `src-${i}` })
      );

      render(<SourcesList sources={sources} maxVisible={3} />);

      expect(screen.getByText('+7 more')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const sources = [createSource()];

      const { container } = render(
        <SourcesList sources={sources} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
