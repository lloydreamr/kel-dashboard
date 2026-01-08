import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useMountedRef } from './useMountedRef';

describe('useMountedRef', () => {
  it('returns isMounted function and mountedRef', () => {
    // Arrange & Act
    const { result } = renderHook(() => useMountedRef());

    // Assert
    expect(result.current.isMounted).toBeInstanceOf(Function);
    expect(result.current.mountedRef).toBeDefined();
    expect(result.current.mountedRef.current).toBe(true);
  });

  it('returns true when component is mounted', () => {
    // Arrange & Act
    const { result } = renderHook(() => useMountedRef());

    // Assert
    expect(result.current.isMounted()).toBe(true);
    expect(result.current.mountedRef.current).toBe(true);
  });

  it('returns false after component unmounts', () => {
    // Arrange
    const { result, unmount } = renderHook(() => useMountedRef());

    // Save reference before unmount
    const { isMounted, mountedRef } = result.current;

    // Act
    unmount();

    // Assert - check both methods after unmount
    expect(isMounted()).toBe(false);
    expect(mountedRef.current).toBe(false);
  });

  it('updates correctly through multiple mount/unmount cycles', () => {
    // Arrange
    const { result, rerender, unmount } = renderHook(() => useMountedRef());

    // Assert - initially mounted
    expect(result.current.isMounted()).toBe(true);

    // Act & Assert - rerender keeps it mounted
    rerender();
    expect(result.current.isMounted()).toBe(true);

    // Act & Assert - unmount sets to false
    unmount();
    expect(result.current.isMounted()).toBe(false);
  });

  it('maintains stable mountedRef across rerenders', () => {
    // Arrange
    const { result, rerender } = renderHook(() => useMountedRef());
    const initialMountedRef = result.current.mountedRef;

    // Act
    rerender();

    // Assert - ref should be stable (isMounted function may be recreated, which is fine)
    expect(result.current.mountedRef).toBe(initialMountedRef);
    expect(result.current.isMounted()).toBe(true);
  });
});
