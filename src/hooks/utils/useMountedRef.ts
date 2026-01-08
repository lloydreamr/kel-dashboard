import { useRef, useEffect, type RefObject } from 'react';

/** Return type for useMountedRef hook */
export interface UseMountedRefReturn {
  mountedRef: RefObject<boolean>;
  isMounted: () => boolean;
}

/**
 * Track component mount state for safe async operations.
 * Use this to prevent state updates or navigation after unmount.
 *
 * @example
 * ```tsx
 * const { isMounted } = useMountedRef();
 *
 * useMutation({
 *   onSuccess: (data) => {
 *     toast.success('Saved'); // Always show toast
 *     if (isMounted()) {      // Only navigate if still mounted
 *       router.push(`/item/${data.id}`);
 *     }
 *   },
 * });
 * ```
 */
export function useMountedRef(): UseMountedRefReturn {
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    mountedRef,
    isMounted: () => mountedRef.current,
  };
}
