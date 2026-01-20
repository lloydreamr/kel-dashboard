/**
 * ClarityMeter Component
 *
 * Visual circular progress meter showing questions answered vs pending.
 * Features color coding and celebration animations at 100% completion.
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { ANIMATION } from '@/lib/constants/animations';

import type { MilestoneProgress } from '@/types';

interface ClarityMeterProps {
  progress: MilestoneProgress | null;
  isLoading?: boolean;
}

// SVG Ring Configuration
const RING_SIZE = 80; // px diameter
const STROKE_WIDTH = 8; // px stroke width - thicker for better visibility at 0%
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Determine stroke color class based on percentage thresholds.
 * AC1 requirement: gray (0-33%), amber (34-66%), green (67-100%)
 * Fixed boundaries: < 34 is gray, < 67 is amber, >= 67 is green
 */
function getStrokeColor(percentage: number): string {
  if (percentage < 34) return 'stroke-muted-foreground';
  if (percentage < 67) return 'stroke-amber-500';
  return 'stroke-green-500';
}

/**
 * Determine text color class based on percentage thresholds.
 * Fixed boundaries: < 34 is gray, < 67 is amber, >= 67 is green
 */
function getTextColor(percentage: number): string {
  if (percentage < 34) return 'text-muted-foreground';
  if (percentage < 67) return 'text-amber-500';
  return 'text-green-500';
}

/**
 * Circular progress ring using SVG.
 */
function ClarityMeterRing({ percentage }: { percentage: number }) {
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
  const strokeColor = getStrokeColor(percentage);

  return (
    <svg
      data-testid="clarity-meter-ring"
      role="img"
      aria-label={`${percentage}% complete`}
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="transform -rotate-90"
    >
      {/* Background ring - using border color for better visibility */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        className="stroke-border"
      />
      {/* Progress ring - Framer Motion handles transitions */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        strokeLinecap="round"
        className={strokeColor}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/**
 * ClarityMeter - Visual progress meter with color coding and celebration.
 * AC1: Shows circular progress with percentage and count.
 * AC2: Celebration animation at 100% (plays once only).
 * AC3: Shows "No questions" when total is 0.
 */
export function ClarityMeter({ progress, isLoading }: ClarityMeterProps) {
  // Track if celebration animation has played (AC2: plays once)
  const [hasAnimated, setHasAnimated] = useState(false);

  // AC3: Handle empty state (0 questions or null progress)
  const isEmpty = !progress || progress.total === 0;

  if (isLoading) {
    return null; // Skeleton will be handled by parent
  }

  if (isEmpty) {
    return (
      <div data-testid="clarity-meter-empty" className="text-center">
        <span className="text-2xl text-muted-foreground">—</span>
        <div className="text-sm text-muted-foreground mt-1">No questions</div>
      </div>
    );
  }

  // Validate and sanitize percentage data
  let percentage = progress.percentage;
  if (Number.isNaN(percentage) || percentage < 0) {
    percentage = 0;
  } else if (percentage > 100) {
    percentage = 100;
  }

  const isComplete = percentage === 100;
  const textColor = getTextColor(percentage);

  // Track animation state - only play celebration once (AC2)
  useEffect(() => {
    if (isComplete && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isComplete, hasAnimated]);

  // AC2: Celebration animation at 100% (once only)
  const shouldAnimate = isComplete && !hasAnimated;

  return (
    <motion.div
      data-testid="clarity-meter"
      className="flex flex-col items-center"
      initial={false}
      animate={shouldAnimate ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={ANIMATION.celebration}
    >
      {/* Circular progress ring */}
      <div className="relative">
        <ClarityMeterRing percentage={percentage} />
        {/* Percentage display in center */}
        <div
          data-testid="clarity-meter-percentage"
          className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${textColor}`}
        >
          {percentage}%
        </div>
      </div>

      {/* Count text below ring (AC1: "X of Y approved") */}
      <div
        data-testid="clarity-meter-count"
        className="text-sm text-muted-foreground mt-2"
      >
        {progress.approved} of {progress.total} approved
      </div>
    </motion.div>
  );
}
