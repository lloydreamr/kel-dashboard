# ConstraintPanel Infinite Loop Bug Fix

**Date:** December 25, 2025
**Issue:** React "Maximum update depth exceeded" error when opening constraint panel
**Status:** Fixed

## Problem

When clicking "Approve with Constraint" button to open the ConstraintPanel, React threw:
```
Maximum update depth exceeded. This can happen when a component calls setState
inside useEffect, but useEffect either doesn't have a dependency array, or one
of the dependencies changes on every render.
```

Three E2E tests were blocked and had to be skipped:
- Kel approves with constraints
- Maho views decision with constraints and marks incorporated
- (Setup test for constrained approval)

## Root Cause Analysis

The infinite loop was caused by **unstable callback references** creating a circular dependency chain:

```
QueueCard renders
    ↓
handleConstraintSuccess (new function each render)
    ↓
ConstraintPanel receives new onSuccess prop
    ↓
ConstraintPanel.handleSuccess recreates (depends on onSuccess)
    ↓
ConstraintConfirmButton receives new onSuccess prop
    ↓
handleConfirm recreates (depends on onSuccess)
    ↓
Sync state effect runs (depends on handleConfirm)
    ↓
onSyncStateChange called → setSyncState in QueueCard
    ↓
QueueCard re-renders → LOOP REPEATS
```

## Fix Applied

### 1. Memoize QueueCard Handlers (`src/components/queue/QueueCard.tsx`)

Wrapped all handler callbacks with `useCallback` to ensure stable references:

```typescript
// BEFORE (recreated every render)
const handleApproveComplete = () => {
  setApprovalState('celebrating');
};

// AFTER (stable reference)
const handleApproveComplete = useCallback(() => {
  setApprovalState('celebrating');
}, []);
```

Handlers fixed:
- `handleApproveComplete`
- `handleConstraintSuccess`
- `handleAlternativesSuccess`
- `handleCelebrationComplete`
- `handleExitComplete`

### 2. Add State Guard to Sync Effect (`src/components/queue/ApproveButton.tsx`, `src/components/queue/ConstraintConfirmButton.tsx`)

Added ref-based guard to prevent calling `onSyncStateChange` unless state actually changed:

```typescript
// Track previous values to avoid unnecessary calls
const prevStateRef = useRef({ isPending: false, isSuccess: false, isError: false });

useEffect(() => {
  const prev = prevStateRef.current;
  // Only call if state actually changed
  if (prev.isPending !== isPending || prev.isSuccess !== isSuccess || prev.isError !== isError) {
    prevStateRef.current = { isPending, isSuccess, isError };
    onSyncStateChange?.({
      isPending,
      isSuccess,
      isError,
      retryFn: isError ? handleConfirm : undefined,
    });
  }
}, [isPending, isSuccess, isError, onSyncStateChange, handleConfirm]);
```

### 3. Memoize Constraint Arrays (`src/components/queue/ConstraintPanel.tsx`)

Memoized arrays that were recreated on each render:

```typescript
// Stable initial constraints reference
const stableInitialConstraints = useMemo(
  () => initialConstraints,
  [initialConstraints.length, ...initialConstraints.map((c) => c.type)]
);

// Stable constraints array for child components
const constraints: Constraint[] = useMemo(
  () => Array.from(selected).map((type) => ({ type })),
  [selected]
);
```

## Testing

### E2E Tests (14 passing, 1 skipped)
- ✅ Kel approves with constraints
- ✅ Maho views decision with constraints and marks incorporated
- ✅ All constraint workflow tests pass consistently

### Skipped Test (Pre-existing Issue)
- ⏭️ "Kel expands card and approves (simple approval)" - separate issue with undo toast not appearing, unrelated to this fix

## Key Learnings

1. **Always memoize callbacks** passed to child components that use them in `useCallback` or `useEffect` dependencies

2. **Guard effect callbacks** when the effect has multiple dependencies - just because one dependency changed doesn't mean you should call the callback

3. **Memoize arrays/objects** used as props or dependencies - `[a, b]` creates a new reference every render

4. **Debug React loops** by tracing the dependency chain:
   - What effect is running?
   - What dependencies changed?
   - What side effect does it trigger?
   - Does that side effect cause a dependency to change?

## Files Changed

- `src/components/queue/QueueCard.tsx` - Added useCallback wrappers
- `src/components/queue/ApproveButton.tsx` - Added sync state guard
- `src/components/queue/ConstraintConfirmButton.tsx` - Added sync state guard
- `src/components/queue/ConstraintPanel.tsx` - Added useMemo for arrays
- `e2e/decisions/decision-flow.spec.ts` - Removed test.skip from constraint tests
