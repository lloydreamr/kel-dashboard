'use client';

/**
 * ApprovalCelebration Component
 *
 * Subtle celebration animation shown after Kel approves a question.
 * Features a checkmark that scales in with a small particle burst.
 *
 * Animation sequence:
 * 1. Checkmark scales in (0-600ms)
 * 2. Small particle burst fades in/out (0-600ms)
 * 3. Component triggers onComplete after animation
 *
 * Requirements: AC2 from Story 4.4
 */

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

import { ANIMATION } from '@/lib/constants/animations';

interface ApprovalCelebrationProps {
  /** Called when the celebration animation completes */
  onComplete?: () => void;
}

/**
 * Celebration animation for approved decisions.
 *
 * @example
 * ```tsx
 * {showCelebration && (
 *   <ApprovalCelebration onComplete={() => setShowCelebration(false)} />
 * )}
 * ```
 */
export function ApprovalCelebration({ onComplete }: ApprovalCelebrationProps) {
  // Trigger onComplete after animation duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, ANIMATION.celebration.duration * 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      data-testid="approval-animation"
      className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={ANIMATION.fade}
    >
      <div data-testid="approval-celebration" className="relative">
        {/* Checkmark that scales in */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={ANIMATION.celebration}
        >
          <CheckCircle className="h-16 w-16 text-success" strokeWidth={1.5} />
        </motion.div>

        {/* Subtle particle burst */}
        <Particles />
      </div>
    </motion.div>
  );
}

/**
 * Simple particle burst effect - subtle confetti around the checkmark.
 */
function Particles() {
  // 6 particles arranged in a circle
  const particles = Array.from({ length: 6 }, (_, i) => ({
    angle: (i * 60 * Math.PI) / 180, // 60 degrees apart
    delay: i * 0.05,
  }));

  return (
    <>
      {particles.map((particle, index) => {
        // Calculate position on a circle
        const x = Math.cos(particle.angle) * 40;
        const y = Math.sin(particle.angle) * 40;

        return (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-success"
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              x: [0, x],
              y: [0, y],
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: ANIMATION.celebration.duration,
              delay: particle.delay,
              times: [0, 0.4, 1],
              ease: ANIMATION.celebration.ease,
            }}
          />
        );
      })}
    </>
  );
}
