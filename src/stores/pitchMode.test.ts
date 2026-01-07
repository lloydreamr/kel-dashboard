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
});
