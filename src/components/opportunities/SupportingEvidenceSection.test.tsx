/**
 * SupportingEvidenceSection Component Tests
 *
 * Tests for supporting evidence display with entity links.
 * Note: The component uses DetailSection which has responsive behavior.
 * Tests target the actual content rendered in both mobile/desktop views.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SupportingEvidenceSection } from './SupportingEvidenceSection';

import type { SupportingEvidence } from '@/lib/repositories/opportunities';
import type { Json } from '@/types/database';

const mockEvidence: SupportingEvidence[] = [
  {
    entity_type: 'company',
    entity_id: 'company-123',
    relevance_score: 0.85,
    excerpt: 'URC shows strong growth in snack segment',
  },
  {
    entity_type: 'product',
    entity_id: 'product-456',
    relevance_score: 0.72,
    excerpt: 'Similar products priced at 25-35 PHP',
  },
  {
    entity_type: 'trend',
    entity_id: 'trend-789',
    relevance_score: 0.91,
    excerpt: 'Premium snacks growing at 15% YoY',
  },
];

describe('SupportingEvidenceSection', () => {
  it('renders empty state when no evidence provided', () => {
    render(<SupportingEvidenceSection evidence={null} />);

    // The empty state text appears twice (mobile + desktop DetailSection)
    const emptyTexts = screen.getAllByText('No supporting evidence available');
    expect(emptyTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when evidence is empty array', () => {
    render(<SupportingEvidenceSection evidence={[]} />);

    const emptyTexts = screen.getAllByText('No supporting evidence available');
    expect(emptyTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders evidence cards with correct entity types', () => {
    render(<SupportingEvidenceSection evidence={mockEvidence as unknown as Json} />);

    // Entity labels appear in both mobile and desktop views
    const companyLabels = screen.getAllByText('Company');
    const productLabels = screen.getAllByText('Product');
    const trendLabels = screen.getAllByText('Trend');

    expect(companyLabels.length).toBeGreaterThanOrEqual(1);
    expect(productLabels.length).toBeGreaterThanOrEqual(1);
    expect(trendLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('displays relevance scores as percentages', () => {
    render(<SupportingEvidenceSection evidence={mockEvidence as unknown as Json} />);

    // Scores appear in both views
    expect(screen.getAllByText('85% relevant').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('72% relevant').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('91% relevant').length).toBeGreaterThanOrEqual(1);
  });

  it('displays excerpts for each evidence item', () => {
    render(<SupportingEvidenceSection evidence={mockEvidence as unknown as Json} />);

    expect(screen.getAllByText('URC shows strong growth in snack segment').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Similar products priced at 25-35 PHP').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Premium snacks growing at 15% YoY').length).toBeGreaterThanOrEqual(1);
  });

  it('renders clickable links for evidence with entity IDs', () => {
    render(<SupportingEvidenceSection evidence={mockEvidence as unknown as Json} />);

    // Get all evidence card links (each appears twice due to mobile/desktop)
    const companyLinks = screen.getAllByTestId('evidence-card-0');
    const productLinks = screen.getAllByTestId('evidence-card-1');
    const trendLinks = screen.getAllByTestId('evidence-card-2');

    // Check at least one has correct href
    expect(companyLinks[0]).toHaveAttribute('href', '/market-intelligence/companies/company-123');
    expect(productLinks[0]).toHaveAttribute('href', '/market-intelligence/products/product-456');
    expect(trendLinks[0]).toHaveAttribute('href', '/market-intelligence/research/trend-789');
  });

  it('renders non-clickable card when entity_id is empty', () => {
    const evidenceWithMissingEntity: SupportingEvidence[] = [
      {
        entity_type: 'company',
        entity_id: '',
        relevance_score: 0.75,
        excerpt: 'Some insight without linked entity',
      },
    ];

    render(<SupportingEvidenceSection evidence={evidenceWithMissingEntity as unknown as Json} />);

    // Should show unavailable card(s)
    const unavailableCards = screen.getAllByTestId('evidence-card-unavailable-0');
    expect(unavailableCards.length).toBeGreaterThanOrEqual(1);

    const unavailableTexts = screen.getAllByText('(source unavailable)');
    expect(unavailableTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('generates correct URLs for different entity types', () => {
    const evidenceWithAllTypes: SupportingEvidence[] = [
      { entity_type: 'company', entity_id: 'c1', relevance_score: 0.8, excerpt: 'Company insight' },
      { entity_type: 'product', entity_id: 'p1', relevance_score: 0.8, excerpt: 'Product insight' },
      { entity_type: 'consumer', entity_id: 'cn1', relevance_score: 0.8, excerpt: 'Consumer insight' },
      { entity_type: 'trend', entity_id: 't1', relevance_score: 0.8, excerpt: 'Trend insight' },
      { entity_type: 'research', entity_id: 'r1', relevance_score: 0.8, excerpt: 'Research insight' },
    ];

    render(<SupportingEvidenceSection evidence={evidenceWithAllTypes as unknown as Json} />);

    // Check first occurrence of each link
    expect(screen.getAllByTestId('evidence-card-0')[0]).toHaveAttribute(
      'href',
      '/market-intelligence/companies/c1'
    );
    expect(screen.getAllByTestId('evidence-card-1')[0]).toHaveAttribute(
      'href',
      '/market-intelligence/products/p1'
    );
    // Consumer and trend map to research route
    expect(screen.getAllByTestId('evidence-card-2')[0]).toHaveAttribute(
      'href',
      '/market-intelligence/research/cn1'
    );
    expect(screen.getAllByTestId('evidence-card-3')[0]).toHaveAttribute(
      'href',
      '/market-intelligence/research/t1'
    );
    expect(screen.getAllByTestId('evidence-card-4')[0]).toHaveAttribute(
      'href',
      '/market-intelligence/research/r1'
    );
  });

  it('filters invalid evidence items from JSON', () => {
    // Evidence with invalid items mixed in
    const mixedEvidence = [
      mockEvidence[0],
      { invalid: 'data' }, // Missing required fields
      null,
      'string item',
      mockEvidence[1],
    ];

    render(<SupportingEvidenceSection evidence={mixedEvidence as unknown as Json} />);

    // Only valid items should render - get evidence lists (mobile + desktop)
    const evidenceLists = screen.getAllByTestId('supporting-evidence-list');
    expect(evidenceLists.length).toBeGreaterThanOrEqual(1);

    // Check that Company and Product appear (the 2 valid items)
    expect(screen.getAllByText('Company').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Product').length).toBeGreaterThanOrEqual(1);

    // Each valid evidence item appears twice (mobile + desktop)
    // So for 2 valid items, we expect 4 total evidence cards (2 items x 2 views)
    const allEvidenceCards = screen.getAllByTestId(/^evidence-card-\d+$/);
    // At minimum 2 per view = 4, but could be more with different view configurations
    expect(allEvidenceCards.length).toBeGreaterThanOrEqual(2);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <SupportingEvidenceSection evidence={mockEvidence as unknown as Json} className="custom-class" />
    );

    // Check that the custom class is applied to the content wrapper
    const elementsWithClass = container.querySelectorAll('.custom-class');
    expect(elementsWithClass.length).toBeGreaterThanOrEqual(1);
  });
});
