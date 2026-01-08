# BUG-003: Hover Effect Alignment Fix

**Date:** January 8, 2026
**Status:** Resolved (removed feature)
**Commit:** `757fe1e`

---

## Problem Statement

The ChartClickLayer component overlaid HTML buttons on the scatter chart to provide hover effects and click handling for data points. However, the hover effects were persistently misaligned from the actual SVG data points by approximately 20 pixels.

### Symptoms
- Hover effect circles appeared offset from data point dots
- Clicking the hover area sometimes missed the intended data point
- Transparent overlay remained misaligned even after removing visible styling

### Root Cause

ChartClickLayer calculated button positions based on the Recharts coordinate system, but the positioning didn't account for:
1. SVG viewBox transformations
2. ResponsiveContainer scaling
3. Chart margin/padding differences between calculation and render

---

## Solution

**Removed ChartClickLayer entirely.**

The component was redundant because native Recharts `<Scatter onClick={...}>` handlers already provide click functionality directly on the SVG data points. ChartClickLayer was an additional layer that added complexity without benefit.

### Why Removal Over Fix

1. **Redundancy** - Native Recharts click handlers already worked
2. **Complexity** - Maintaining coordinate sync between HTML overlay and SVG is fragile
3. **User Request** - "Could you just completely remove whatever that feature is since the competitor and Kel's target position dots are clickable anyways"

---

## Changes Made

### Deleted Files
- `src/components/visualization/ChartClickLayer.tsx`
- `src/components/visualization/ChartClickLayer.test.tsx`
- `e2e/visualization/hover-alignment.spec.ts` (if existed)

### Modified Files

**`src/components/visualization/ScatterChart.tsx`**
- Removed `ChartClickLayer` import
- Removed `OverlayPoint` type import
- Removed `overlayPoints` useMemo calculation
- Removed `handleOverlayClick` function
- Removed `<ChartClickLayer>` JSX component

**`src/components/visualization/index.ts`**
- Removed `ChartClickLayer` export
- Removed `OverlayPoint` type export

**`src/components/visualization/ScatterChart.test.tsx`**
- Removed test: "does not render ChartClickLayer in pitch mode"
- Removed test: "renders ChartClickLayer when not in pitch mode"

---

## Behavior After Fix

The scatter chart now uses only native Recharts click handling:

```tsx
<Scatter
  name="Competitors"
  data={competitorData}
  onClick={(data, _index, event) => {
    if (!isMaho) return;
    const point = data.payload as ChartPoint;
    const rect = (event.target as SVGElement).getBoundingClientRect();
    setPopoverAnchor({ x: rect.left + rect.width / 2, y: rect.top });
    const competitor = competitors?.find((c) => c.id === point.id);
    if (competitor) {
      setSelectedCompetitor(competitor);
    }
  }}
  style={{ cursor: isMaho ? 'pointer' : 'default' }}
>
```

Clicking directly on:
- **Competitor dots** - Opens competitor detail sheet/popover
- **Kel position dot** - Opens Kel position dialog

---

## Test Coverage

- **Unit tests:** 41/41 passing for ScatterChart
- **Full test suite:** 1779/1779 passing
- **E2E:** Pitch mode flow tests continue to pass

---

## Lessons Learned

1. **Don't duplicate browser-native functionality** - If the underlying library (Recharts) already handles clicks, don't add another click layer
2. **HTML overlays on SVG are fragile** - Coordinate systems don't align perfectly across different rendering contexts
3. **Simpler is better** - Removing 700+ lines of code simplified the codebase without losing functionality
