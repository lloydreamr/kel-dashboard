/**
 * ClarityMeterSkeleton Component
 *
 * Loading placeholder matching ClarityMeter dimensions and layout.
 */

// SVG Ring Configuration (matches ClarityMeter)
const RING_SIZE = 80; // px diameter
const STROKE_WIDTH = 8; // px stroke width - matches ClarityMeter
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;

export function ClarityMeterSkeleton() {
  return (
    <div
      data-testid="clarity-meter-skeleton"
      className="flex flex-col items-center animate-pulse"
    >
      {/* Circular skeleton ring */}
      <div className="relative">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            className="stroke-muted"
          />
        </svg>
        {/* Skeleton percentage placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-12 bg-muted rounded" />
        </div>
      </div>

      {/* Skeleton count text */}
      <div className="h-4 w-24 bg-muted rounded mt-2" />
    </div>
  );
}
