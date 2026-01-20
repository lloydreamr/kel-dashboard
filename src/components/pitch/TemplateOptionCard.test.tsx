/**
 * TemplateOptionCard Tests
 *
 * Story 18-4: Pitch Template Library
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadioGroup } from '@/components/ui/radio-group';
import { TemplateOptionCard } from './TemplateOptionCard';
import { MID_SIZE_TEMPLATE, WOFEX_BOOTH_TEMPLATE } from '@/lib/pitch';

// Wrap in RadioGroup since TemplateOptionCard uses RadioGroupPrimitive.Item
function renderInRadioGroup(
  ui: React.ReactElement,
  { defaultValue }: { defaultValue?: string } = {}
) {
  return render(
    <RadioGroup defaultValue={defaultValue}>{ui}</RadioGroup>
  );
}

describe('TemplateOptionCard', () => {
  describe('template option', () => {
    it('renders template name', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      expect(screen.getByText('Mid-Size Distributor Pitch')).toBeInTheDocument();
    });

    it('renders template description', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      expect(
        screen.getByText(/For established distributors like EFC/)
      ).toBeInTheDocument();
    });

    it('renders target audience', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      expect(screen.getByText(/Mid-size distributors/)).toBeInTheDocument();
    });

    it('renders section badges', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Competitive Positioning')).toBeInTheDocument();
      expect(screen.getByText('Trend Alignment')).toBeInTheDocument();
    });

    it('renders tone indicator', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      expect(screen.getByText('formal')).toBeInTheDocument();
    });

    it('renders energetic tone for WOFEX template', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={WOFEX_BOOTH_TEMPLATE}
          selected={false}
          value="wofex_booth"
        />
      );

      expect(screen.getByText('energetic')).toBeInTheDocument();
    });

    it('has correct test id', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      expect(screen.getByTestId('template-option-mid_size')).toBeInTheDocument();
    });
  });

  describe('custom option (null template)', () => {
    it('renders Custom Pitch name', () => {
      renderInRadioGroup(
        <TemplateOptionCard template={null} selected={false} value="none" />
      );

      expect(screen.getByText('Custom Pitch')).toBeInTheDocument();
    });

    it('renders custom description', () => {
      renderInRadioGroup(
        <TemplateOptionCard template={null} selected={false} value="none" />
      );

      expect(
        screen.getByText(/Start from scratch with no pre-defined sections/)
      ).toBeInTheDocument();
    });

    it('does not render section badges', () => {
      renderInRadioGroup(
        <TemplateOptionCard template={null} selected={false} value="none" />
      );

      expect(screen.queryByText('Market Opportunity')).not.toBeInTheDocument();
    });

    it('does not render tone indicator', () => {
      renderInRadioGroup(
        <TemplateOptionCard template={null} selected={false} value="none" />
      );

      expect(screen.queryByText('Tone:')).not.toBeInTheDocument();
    });
  });

  describe('selected state', () => {
    it('applies selected styles when selected', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={true}
          value="mid_size"
        />,
        { defaultValue: 'mid_size' }
      );

      const card = screen.getByTestId('template-option-mid_size');
      expect(card).toHaveClass('border-primary');
    });

    it('applies unselected styles when not selected', () => {
      renderInRadioGroup(
        <TemplateOptionCard
          template={MID_SIZE_TEMPLATE}
          selected={false}
          value="mid_size"
        />
      );

      const card = screen.getByTestId('template-option-mid_size');
      expect(card).toHaveClass('border-muted');
    });
  });
});
