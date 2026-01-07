/**
 * Pitch Mode Store Tests
 *
 * Unit tests for the pitch mode state management store.
 *
 * Story 11.1: Pitch Mode View (Task 9)
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { usePitchModeStore } from './pitchMode';

describe('usePitchModeStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    usePitchModeStore.setState({ isPitchMode: false });
  });

  describe('initial state', () => {
    it('starts with pitch mode disabled', () => {
      // Arrange & Act
      const state = usePitchModeStore.getState();

      // Assert
      expect(state.isPitchMode).toBe(false);
    });
  });

  describe('setIsPitchMode', () => {
    it('sets isPitchMode to true', () => {
      // Arrange
      const { setIsPitchMode } = usePitchModeStore.getState();

      // Act
      setIsPitchMode(true);

      // Assert
      expect(usePitchModeStore.getState().isPitchMode).toBe(true);
    });

    it('sets isPitchMode to false', () => {
      // Arrange
      usePitchModeStore.setState({ isPitchMode: true });
      const { setIsPitchMode } = usePitchModeStore.getState();

      // Act
      setIsPitchMode(false);

      // Assert
      expect(usePitchModeStore.getState().isPitchMode).toBe(false);
    });

    it('can be toggled multiple times', () => {
      // Arrange
      const { setIsPitchMode } = usePitchModeStore.getState();

      // Act & Assert
      setIsPitchMode(true);
      expect(usePitchModeStore.getState().isPitchMode).toBe(true);

      setIsPitchMode(false);
      expect(usePitchModeStore.getState().isPitchMode).toBe(false);

      setIsPitchMode(true);
      expect(usePitchModeStore.getState().isPitchMode).toBe(true);
    });

    it('setting same value is idempotent', () => {
      // Arrange
      const { setIsPitchMode } = usePitchModeStore.getState();

      // Act
      setIsPitchMode(true);
      setIsPitchMode(true);
      setIsPitchMode(true);

      // Assert
      expect(usePitchModeStore.getState().isPitchMode).toBe(true);
    });
  });

  describe('store subscription', () => {
    it('notifies subscribers when state changes', () => {
      // Arrange
      const changes: boolean[] = [];
      const unsubscribe = usePitchModeStore.subscribe((state) => {
        changes.push(state.isPitchMode);
      });

      // Act
      usePitchModeStore.getState().setIsPitchMode(true);
      usePitchModeStore.getState().setIsPitchMode(false);

      // Assert
      expect(changes).toEqual([true, false]);

      // Cleanup
      unsubscribe();
    });
  });

  // Story 11.2: PDF Export state management
  describe('PDF export state (Story 11.2)', () => {
    beforeEach(() => {
      usePitchModeStore.setState({
        isPitchMode: false,
        isGeneratingPdf: false,
        onDownloadPdf: null,
      });
    });

    describe('isGeneratingPdf', () => {
      it('starts as false', () => {
        // Arrange & Act
        const state = usePitchModeStore.getState();

        // Assert
        expect(state.isGeneratingPdf).toBe(false);
      });

      it('can be set to true via setIsGeneratingPdf', () => {
        // Arrange
        const { setIsGeneratingPdf } = usePitchModeStore.getState();

        // Act
        setIsGeneratingPdf(true);

        // Assert
        expect(usePitchModeStore.getState().isGeneratingPdf).toBe(true);
      });

      it('can be set to false via setIsGeneratingPdf', () => {
        // Arrange
        usePitchModeStore.setState({ isGeneratingPdf: true });
        const { setIsGeneratingPdf } = usePitchModeStore.getState();

        // Act
        setIsGeneratingPdf(false);

        // Assert
        expect(usePitchModeStore.getState().isGeneratingPdf).toBe(false);
      });
    });

    describe('onDownloadPdf callback', () => {
      it('starts as null', () => {
        // Arrange & Act
        const state = usePitchModeStore.getState();

        // Assert
        expect(state.onDownloadPdf).toBeNull();
      });

      it('registerPdfDownload sets the callback', () => {
        // Arrange
        const mockCallback = vi.fn();
        const { registerPdfDownload } = usePitchModeStore.getState();

        // Act
        registerPdfDownload(mockCallback);

        // Assert
        expect(usePitchModeStore.getState().onDownloadPdf).toBe(mockCallback);
      });

      it('unregisterPdfDownload clears the callback', () => {
        // Arrange
        usePitchModeStore.setState({ onDownloadPdf: vi.fn() });
        const { unregisterPdfDownload } = usePitchModeStore.getState();

        // Act
        unregisterPdfDownload();

        // Assert
        expect(usePitchModeStore.getState().onDownloadPdf).toBeNull();
      });

      it('registered callback can be invoked', () => {
        // Arrange
        const mockCallback = vi.fn();
        const { registerPdfDownload } = usePitchModeStore.getState();
        registerPdfDownload(mockCallback);

        // Act
        const { onDownloadPdf } = usePitchModeStore.getState();
        onDownloadPdf?.();

        // Assert
        expect(mockCallback).toHaveBeenCalledTimes(1);
      });
    });
  });
});
