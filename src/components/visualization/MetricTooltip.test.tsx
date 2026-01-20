import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';
import { METRIC_GLOSSARY } from '@/lib/constants/glossary';

import { MetricTooltip } from './MetricTooltip';

/**
 * Render helper that wraps component with TooltipProvider.
 * Radix tooltips require a provider for proper functionality.
 */
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

describe('MetricTooltip', () => {
  it('renders children with tooltip trigger', () => {
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-quality-score')).toBeInTheDocument();
  });

  it('displays tooltip content on hover', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    const trigger = screen.getByTestId('tooltip-quality-score');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip-content')).toBeVisible();
    });
  });

  it('displays correct definition for qualityScore', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    await user.hover(screen.getByTestId('tooltip-quality-score'));

    await waitFor(() => {
      // Radix creates duplicate content for accessibility, so use getAllByText
      const definitions = screen.getAllByText(METRIC_GLOSSARY.qualityScore.definition);
      expect(definitions.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays correct definition for priceRange', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="priceRange">Price Range</MetricTooltip>
    );

    await user.hover(screen.getByTestId('tooltip-price-range'));

    await waitFor(() => {
      const definitions = screen.getAllByText(METRIC_GLOSSARY.priceRange.definition);
      expect(definitions.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays correct definition for marketPosition', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="marketPosition">Market Position</MetricTooltip>
    );

    await user.hover(screen.getByTestId('tooltip-market-position'));

    await waitFor(() => {
      const definitions = screen.getAllByText(METRIC_GLOSSARY.marketPosition.definition);
      expect(definitions.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays scale information in tooltip', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    await user.hover(screen.getByTestId('tooltip-quality-score'));

    await waitFor(() => {
      // Radix creates duplicate content for accessibility, so use getAllByText
      const scaleLabels = screen.getAllByText(/Scale:/);
      expect(scaleLabels.length).toBeGreaterThanOrEqual(1);
      const scaleValues = screen.getAllByText(METRIC_GLOSSARY.qualityScore.scale);
      expect(scaleValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays good value information in tooltip', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    await user.hover(screen.getByTestId('tooltip-quality-score'));

    await waitFor(() => {
      // Radix creates duplicate content for accessibility, so use getAllByText
      const goodLabels = screen.getAllByText(/Good:/);
      expect(goodLabels.length).toBeGreaterThanOrEqual(1);
      const goodValues = screen.getAllByText(METRIC_GLOSSARY.qualityScore.goodValue);
      expect(goodValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('includes info icon for visual affordance', () => {
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    const trigger = screen.getByTestId('tooltip-quality-score');
    const svgIcon = trigger.querySelector('svg');

    expect(svgIcon).toBeInTheDocument();
  });

  it('is keyboard accessible via tab', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <MetricTooltip metricKey="qualityScore">Quality Score</MetricTooltip>
    );

    const trigger = screen.getByTestId('tooltip-quality-score');

    // Verify tabIndex is set for keyboard accessibility
    expect(trigger).toHaveAttribute('tabIndex', '0');

    // Tab to trigger
    await user.tab();

    // Should be focused
    expect(trigger).toHaveFocus();
  });
});
