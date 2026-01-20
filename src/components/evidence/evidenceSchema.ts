import { z } from 'zod';

import { isValidEvidenceUrl } from '@/types/evidence';

/**
 * Schema for adding evidence to a question.
 * Title and URL are required; anchor and excerpt are optional.
 */
export const createEvidenceSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters'),
  url: z
    .string()
    .min(1, 'URL is required')
    .refine(isValidEvidenceUrl, {
      message: 'Invalid URL. Must be http:// or https://',
    }),
  section_anchor: z
    .string()
    .max(100, 'Anchor must be under 100 characters')
    .optional()
    .transform((val) => val?.trim() || null),
  excerpt: z
    .string()
    .max(500, 'Excerpt must be under 500 characters')
    .optional()
    .transform((val) => val?.trim() || null),
});

/**
 * Type for evidence form input (before transforms).
 * Used by react-hook-form for form state.
 */
export type CreateEvidenceFormInput = z.input<typeof createEvidenceSchema>;

/**
 * Type for evidence form output (after transforms).
 * Used for the API submission with null values.
 */
export type CreateEvidenceFormData = z.output<typeof createEvidenceSchema>;
