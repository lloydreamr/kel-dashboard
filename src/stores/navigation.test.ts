/**
 * Navigation Store Tests
 *
 * Unit tests for the mobile navigation drawer state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { useNavigationStore } from './navigation';

describe('useNavigationStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useNavigationStore.setState({ isOpen: false });
  });

  describe('initial state', () => {
    it('starts with drawer closed', () => {
      // Arrange & Act
      const state = useNavigationStore.getState();

      // Assert
      expect(state.isOpen).toBe(false);
    });
  });

  describe('open', () => {
    it('sets isOpen to true', () => {
      // Arrange
      const { open } = useNavigationStore.getState();

      // Act
      open();

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(true);
    });

    it('stays open if already open', () => {
      // Arrange
      useNavigationStore.setState({ isOpen: true });
      const { open } = useNavigationStore.getState();

      // Act
      open();

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(true);
    });
  });

  describe('close', () => {
    it('sets isOpen to false', () => {
      // Arrange
      useNavigationStore.setState({ isOpen: true });
      const { close } = useNavigationStore.getState();

      // Act
      close();

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });

    it('stays closed if already closed', () => {
      // Arrange
      const { close } = useNavigationStore.getState();

      // Act
      close();

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });
  });

  describe('toggle', () => {
    it('opens drawer when closed', () => {
      // Arrange
      const { toggle } = useNavigationStore.getState();

      // Act
      toggle();

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(true);
    });

    it('closes drawer when open', () => {
      // Arrange
      useNavigationStore.setState({ isOpen: true });
      const { toggle } = useNavigationStore.getState();

      // Act
      toggle();

      // Assert
      expect(useNavigationStore.getState().isOpen).toBe(false);
    });

    it('can toggle multiple times', () => {
      // Arrange
      const { toggle } = useNavigationStore.getState();

      // Act & Assert
      toggle();
      expect(useNavigationStore.getState().isOpen).toBe(true);

      toggle();
      expect(useNavigationStore.getState().isOpen).toBe(false);

      toggle();
      expect(useNavigationStore.getState().isOpen).toBe(true);
    });
  });
});
