import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CategorySection } from './CategorySection';

describe('CategorySection', () => {
  it('renders with correct test ID for market category', () => {
    render(
      <CategorySection category="market" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByTestId('category-section-market')).toBeInTheDocument();
  });

  it('renders with correct test ID for product category', () => {
    render(
      <CategorySection category="product" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByTestId('category-section-product')).toBeInTheDocument();
  });

  it('renders with correct test ID for distribution category', () => {
    render(
      <CategorySection category="distribution" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByTestId('category-section-distribution')).toBeInTheDocument();
  });

  it('displays correct label for market category', () => {
    render(
      <CategorySection category="market" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByText('Market')).toBeInTheDocument();
  });

  it('displays correct label for product category', () => {
    render(
      <CategorySection category="product" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('displays correct label for distribution category', () => {
    render(
      <CategorySection category="distribution" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByText('Distribution')).toBeInTheDocument();
  });

  it('displays singular "question" when count is 1', () => {
    render(
      <CategorySection category="market" count={1}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByText('1 question')).toBeInTheDocument();
  });

  it('displays plural "questions" when count is 0', () => {
    render(
      <CategorySection category="market" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByText('0 questions')).toBeInTheDocument();
  });

  it('displays plural "questions" when count is greater than 1', () => {
    render(
      <CategorySection category="market" count={5}>
        <p>Children</p>
      </CategorySection>
    );
    expect(screen.getByText('5 questions')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <CategorySection category="market" count={0}>
        <p data-testid="child-content">Test child content</p>
      </CategorySection>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test child content')).toBeInTheDocument();
  });

  it('applies blue colors for market category', () => {
    render(
      <CategorySection category="market" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    const section = screen.getByTestId('category-section-market');
    expect(section).toHaveClass('border-blue-200');
  });

  it('applies green colors for product category', () => {
    render(
      <CategorySection category="product" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    const section = screen.getByTestId('category-section-product');
    expect(section).toHaveClass('border-green-200');
  });

  it('applies orange colors for distribution category', () => {
    render(
      <CategorySection category="distribution" count={0}>
        <p>Children</p>
      </CategorySection>
    );
    const section = screen.getByTestId('category-section-distribution');
    expect(section).toHaveClass('border-orange-200');
  });
});
