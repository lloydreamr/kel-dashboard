/**
 * Print Styles Unit Test - Story 11.3
 *
 * Verifies that print-specific CSS rules exist in globals.css.
 * This provides regression protection against accidental deletion of print styles.
 *
 * Note: Actual CSS behavior is tested in E2E tests using Playwright's emulateMedia.
 * These unit tests verify the CSS file structure as a safety net.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { describe, it, expect, beforeAll } from 'vitest';

describe('Print Styles (Story 11.3)', () => {
  let cssContent: string;

  beforeAll(() => {
    // Read the globals.css file
    const cssPath = join(__dirname, 'globals.css');
    cssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('Print media query exists', () => {
    it('contains @media print block', () => {
      expect(cssContent).toContain('@media print');
    });

    it('contains @page rule for A4 sizing', () => {
      expect(cssContent).toContain('@page');
      expect(cssContent).toContain('size: A4');
      expect(cssContent).toContain('margin: 15mm');
    });
  });

  describe('Hidden elements rules (Task 1.2-1.7)', () => {
    it('hides nav-sidebar in print', () => {
      expect(cssContent).toContain('[data-testid="nav-sidebar"]');
    });

    it('hides nav-drawer in print', () => {
      expect(cssContent).toContain('[data-testid="nav-drawer"]');
    });

    it('hides pitch-mode-header in print', () => {
      expect(cssContent).toContain('[data-testid="pitch-mode-header"]');
    });

    it('hides quick-capture-widget in print', () => {
      expect(cssContent).toContain('[data-testid="quick-capture-widget"]');
    });

    it('hides offline-banner in print', () => {
      expect(cssContent).toContain('[data-testid="offline-banner"]');
    });

    it('hides buttons in print', () => {
      // Verify button selector is in the hidden elements list
      expect(cssContent).toMatch(/button[,\s{]/);
    });

    it('uses display: none for hidden elements', () => {
      expect(cssContent).toContain('display: none !important');
    });
  });

  describe('Print-friendly defaults (Task 1.8, 1.9)', () => {
    it('sets print-friendly body colors using hex values', () => {
      // Story 11.3 dev notes: Use explicit hex colors, not oklch()
      // Check for black text and white background within @media print
      const printMediaMatch = cssContent.match(/@media print\s*\{[\s\S]*?\n\}/);
      expect(printMediaMatch).not.toBeNull();

      const printBlock = printMediaMatch![0];
      expect(printBlock).toContain('color: #000000');
      expect(printBlock).toContain('background: #ffffff');
    });

    it('sets readable font size (12pt)', () => {
      expect(cssContent).toContain('font-size: 12pt');
    });

    it('sets appropriate line height', () => {
      expect(cssContent).toContain('line-height: 1.5');
    });
  });

  describe('Chart container optimization (Task 3)', () => {
    it('targets print-preview-content for print optimization', () => {
      expect(cssContent).toContain('[data-testid="print-preview-content"]');
    });

    it('sets max-width for A4 paper (680px)', () => {
      expect(cssContent).toContain('max-width: 680px');
    });

    it('centers chart container', () => {
      expect(cssContent).toContain('margin: 0 auto');
    });
  });

  describe('Page break behavior (Task 4)', () => {
    it('prevents break inside chart container', () => {
      expect(cssContent).toContain('break-inside: avoid');
    });

    it('prevents break after headings', () => {
      expect(cssContent).toContain('break-after: avoid');
    });

    it('keeps legend with chart (break-before: avoid)', () => {
      expect(cssContent).toContain('[data-testid="chart-legend"]');
      expect(cssContent).toContain('break-before: avoid');
    });

    it('ensures SVG elements avoid breaking', () => {
      expect(cssContent).toMatch(/svg[,\s{]/);
    });
  });

  describe('No-print utility class', () => {
    it('includes .no-print class for manual hiding', () => {
      expect(cssContent).toContain('.no-print');
    });
  });
});
