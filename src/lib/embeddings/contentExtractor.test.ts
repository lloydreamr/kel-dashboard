/**
 * Content Extractor Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  extractCompanyContent,
  extractProductContent,
  extractConsumerContent,
  extractTrendContent,
  extractResearchDocContent,
} from './contentExtractor';

describe('extractCompanyContent', () => {
  it('extracts basic company info', () => {
    const company = {
      id: '123',
      name: 'Universal Robina Corp',
      category: 'Snacks',
      raw_content: null,
      strengths: null,
      weaknesses: null,
      distribution_reach: null,
      products: null,
      market_share: null,
      revenue_estimate: null,
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractCompanyContent(company);

    expect(content).toContain('# Universal Robina Corp');
    expect(content).toContain('Category: Snacks');
  });

  it('includes strengths and weaknesses', () => {
    const company = {
      id: '123',
      name: 'Test Company',
      category: null,
      raw_content: 'This is the raw content about the company.',
      strengths: ['Strong brand', 'Wide distribution'],
      weaknesses: ['High prices', 'Limited flavors'],
      distribution_reach: 'Nationwide coverage',
      products: ['Product A', 'Product B'],
      market_share: 35,
      revenue_estimate: '₱50 billion',
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractCompanyContent(company);

    expect(content).toContain('## Strengths');
    expect(content).toContain('- Strong brand');
    expect(content).toContain('## Weaknesses');
    expect(content).toContain('- High prices');
    expect(content).toContain('## Distribution');
    expect(content).toContain('Nationwide coverage');
    expect(content).toContain('Market share: 35%');
    expect(content).toContain('Revenue estimate: ₱50 billion');
  });

  it('handles null fields gracefully', () => {
    const company = {
      id: '123',
      name: 'Minimal Company',
      category: null,
      raw_content: null,
      strengths: null,
      weaknesses: null,
      distribution_reach: null,
      products: null,
      market_share: null,
      revenue_estimate: null,
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractCompanyContent(company);

    expect(content).toBe('# Minimal Company');
    expect(content).not.toContain('null');
    expect(content).not.toContain('undefined');
  });
});

describe('extractProductContent', () => {
  it('extracts product info', () => {
    const product = {
      id: '456',
      name: 'Chippy',
      category: 'Corn Snacks',
      company_id: '123',
      market_position: 'Value leader in corn chips segment',
      price_tier: 'Budget',
      price_point: 15,
      flavor_profile: ['BBQ', 'Cheese', 'Garlic'],
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractProductContent(product);

    expect(content).toContain('# Chippy');
    expect(content).toContain('Category: Corn Snacks');
    expect(content).toContain('## Market Position');
    expect(content).toContain('Value leader');
    expect(content).toContain('Price tier: Budget');
    expect(content).toContain('₱15');
    expect(content).toContain('BBQ, Cheese, Garlic');
  });

  it('handles minimal product', () => {
    const product = {
      id: '456',
      name: 'Basic Snack',
      category: null,
      company_id: null,
      market_position: null,
      price_tier: null,
      price_point: null,
      flavor_profile: null,
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractProductContent(product);

    expect(content).toBe('# Basic Snack');
  });
});

describe('extractConsumerContent', () => {
  it('extracts consumer segment info', () => {
    const consumer = {
      id: '789',
      segment_name: 'College Students',
      behaviors: ['Snack between classes', 'Share with friends'],
      preferences: ['Value-sized packs', 'Spicy flavors'],
      pain_points: ['Limited budget', 'Want variety'],
      demographics: { age: '18-24', income: 'Low-Medium' },
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractConsumerContent(consumer);

    expect(content).toContain('# Consumer Segment: College Students');
    expect(content).toContain('## Behaviors');
    expect(content).toContain('- Snack between classes');
    expect(content).toContain('## Preferences');
    expect(content).toContain('- Value-sized packs');
    expect(content).toContain('## Pain Points');
    expect(content).toContain('- Limited budget');
    expect(content).toContain('## Demographics');
    expect(content).toContain('age: 18-24');
  });

  it('handles minimal consumer segment', () => {
    const consumer = {
      id: '789',
      segment_name: 'Unknown Segment',
      behaviors: null,
      preferences: null,
      pain_points: null,
      demographics: null,
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractConsumerContent(consumer);

    expect(content).toBe('# Consumer Segment: Unknown Segment');
  });
});

describe('extractTrendContent', () => {
  it('extracts trend info', () => {
    const trend = {
      id: '101',
      name: 'Health-Conscious Snacking',
      category: 'Consumer Behavior',
      description:
        'Growing trend toward healthier snack options with lower sodium and no MSG.',
      growth_rate: '15% annually',
      status: 'Growing',
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractTrendContent(trend);

    expect(content).toContain('# Trend: Health-Conscious Snacking');
    expect(content).toContain('Category: Consumer Behavior');
    expect(content).toContain('## Description');
    expect(content).toContain('healthier snack options');
    expect(content).toContain('Growth rate: 15% annually');
    expect(content).toContain('Status: Growing');
  });

  it('handles minimal trend', () => {
    const trend = {
      id: '101',
      name: 'New Trend',
      category: null,
      description: null,
      growth_rate: null,
      status: null,
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractTrendContent(trend);

    expect(content).toBe('# Trend: New Trend');
  });
});

describe('extractResearchDocContent', () => {
  it('extracts research doc with content', () => {
    const doc = {
      id: '202',
      title: 'Philippine Snack Market Analysis 2024',
      category: 'Market Research',
      content:
        'Comprehensive analysis of the Philippine snack market including market size, growth projections, and competitive landscape.',
      summary: 'Market overview and growth projections.',
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractResearchDocContent(doc);

    expect(content).toContain('# Philippine Snack Market Analysis 2024');
    expect(content).toContain('Category: Market Research');
    expect(content).toContain('Comprehensive analysis');
    // Content takes precedence over summary
    expect(content).not.toContain('Market overview and growth projections.');
  });

  it('falls back to summary when no content', () => {
    const doc = {
      id: '202',
      title: 'Brief Report',
      category: null,
      content: null,
      summary: 'This is the summary when content is unavailable.',
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractResearchDocContent(doc);

    expect(content).toContain('# Brief Report');
    expect(content).toContain('This is the summary');
  });

  it('handles minimal doc', () => {
    const doc = {
      id: '202',
      title: 'Empty Doc',
      category: null,
      content: null,
      summary: null,
      source_file: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const content = extractResearchDocContent(doc);

    expect(content).toBe('# Empty Doc');
  });
});
