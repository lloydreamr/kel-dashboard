/**
 * SendToKelChecklist Component Tests
 *
 * Tests for the visual checklist showing requirements
 * before sending a question to Kel.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SendToKelChecklist } from './SendToKelChecklist';

describe('SendToKelChecklist', () => {
  describe('visibility', () => {
    it('shows checklist when both requirements are incomplete', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={false}
        />
      );
      expect(screen.getByTestId('send-to-kel-checklist')).toBeInTheDocument();
    });

    it('shows checklist when only evidence is missing', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={true}
        />
      );
      expect(screen.getByTestId('send-to-kel-checklist')).toBeInTheDocument();
    });

    it('shows checklist when only recommendation is missing', () => {
      render(
        <SendToKelChecklist
          hasEvidence={true}
          hasRecommendation={false}
        />
      );
      expect(screen.getByTestId('send-to-kel-checklist')).toBeInTheDocument();
    });

    it('hides checklist when all requirements are complete', () => {
      render(
        <SendToKelChecklist
          hasEvidence={true}
          hasRecommendation={true}
        />
      );
      expect(screen.queryByTestId('send-to-kel-checklist')).not.toBeInTheDocument();
    });
  });

  describe('evidence item', () => {
    it('shows empty circle when evidence is missing', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={false}
        />
      );
      expect(screen.getByTestId('checklist-evidence-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('checklist-evidence-check')).not.toBeInTheDocument();
    });

    it('shows checkmark when evidence is present', () => {
      render(
        <SendToKelChecklist
          hasEvidence={true}
          hasRecommendation={false}
        />
      );
      expect(screen.getByTestId('checklist-evidence-check')).toBeInTheDocument();
      expect(screen.queryByTestId('checklist-evidence-empty')).not.toBeInTheDocument();
    });

    it('displays evidence count in label', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={false}
          evidenceCount={0}
        />
      );
      expect(screen.getByTestId('checklist-evidence')).toHaveTextContent('Add evidence (0/1 minimum)');
    });

    it('displays updated evidence count', () => {
      render(
        <SendToKelChecklist
          hasEvidence={true}
          hasRecommendation={false}
          evidenceCount={3}
        />
      );
      expect(screen.getByTestId('checklist-evidence')).toHaveTextContent('Add evidence (3/1 minimum)');
    });
  });

  describe('recommendation item', () => {
    it('shows empty circle when recommendation is missing', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={false}
        />
      );
      expect(screen.getByTestId('checklist-recommendation-empty')).toBeInTheDocument();
      expect(screen.queryByTestId('checklist-recommendation-check')).not.toBeInTheDocument();
    });

    it('shows checkmark when recommendation is present', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={true}
        />
      );
      expect(screen.getByTestId('checklist-recommendation-check')).toBeInTheDocument();
      expect(screen.queryByTestId('checklist-recommendation-empty')).not.toBeInTheDocument();
    });

    it('displays correct recommendation label', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={false}
        />
      );
      expect(screen.getByTestId('checklist-recommendation')).toHaveTextContent('Write a recommendation');
    });
  });

  describe('header text', () => {
    it('displays "Before sending to Kel:" header', () => {
      render(
        <SendToKelChecklist
          hasEvidence={false}
          hasRecommendation={false}
        />
      );
      expect(screen.getByText('Before sending to Kel:')).toBeInTheDocument();
    });
  });
});
