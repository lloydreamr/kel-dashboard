/**
 * Recommendation Form Schema
 *
 * Zod validation schema for the recommendation form.
 */

import { z } from 'zod';

/**
 * Schema for creating/editing a recommendation.
 * - recommendation: Required, the actual recommendation text
 * - recommendation_rationale: Optional but encouraged, explains the "why"
 */
export const recommendationSchema = z.object({
  recommendation: z.string().min(1, 'Recommendation is required'),
  recommendation_rationale: z.string().optional(),
});

/**
 * TypeScript type inferred from the schema.
 * Use this for form data typing.
 */
export type RecommendationFormData = z.infer<typeof recommendationSchema>;
