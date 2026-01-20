/**
 * Zod schema for Kel Position Form
 *
 * Simplified form for setting Kel's target position.
 * Only includes scores and optional notes (no name, category).
 */

import { z } from 'zod';

export const kelPositionFormSchema = z.object({
  price_score: z.number().min(1, 'Minimum is 1').max(10, 'Maximum is 10'),
  quality_score: z.number().min(1, 'Minimum is 1').max(10, 'Maximum is 10'),
  notes: z.string().max(500, 'Notes too long').nullable().optional(),
});

export type KelPositionFormData = z.infer<typeof kelPositionFormSchema>;
