import { z } from 'zod';

/**
 * Schema for creating a new question.
 * Title is required, description is optional.
 */
export const createQuestionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['market', 'product', 'distribution']),
});

/**
 * Type for create question form data.
 * Inferred from the Zod schema for type safety.
 */
export type CreateQuestionFormData = z.infer<typeof createQuestionSchema>;

/**
 * Category options for the select dropdown.
 * Labels are title case for display.
 */
export const CATEGORY_OPTIONS = [
  { value: 'market', label: 'Market' },
  { value: 'product', label: 'Product' },
  { value: 'distribution', label: 'Distribution' },
] as const;
