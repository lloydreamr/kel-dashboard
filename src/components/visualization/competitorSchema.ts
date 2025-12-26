import { z } from 'zod';

export const COMPETITOR_CATEGORIES = ['Chips', 'Crackers', 'Puffs', 'Other'] as const;

export type CompetitorCategory = typeof COMPETITOR_CATEGORIES[number];

export const competitorFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  price_score: z.number().min(1, 'Minimum is 1').max(10, 'Maximum is 10'),
  quality_score: z.number().min(1, 'Minimum is 1').max(10, 'Maximum is 10'),
  category: z.enum(COMPETITOR_CATEGORIES).nullable().optional(),
  notes: z.string().max(500, 'Notes too long').nullable().optional(),
  is_kel_position: z.boolean().optional().default(false),
});

export type CompetitorFormData = z.infer<typeof competitorFormSchema>;
