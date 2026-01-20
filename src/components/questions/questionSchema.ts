import { z } from 'zod';

/**
 * Valid category values for questions.
 */
export const QUESTION_CATEGORIES = ['market', 'product', 'distribution'] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

/**
 * Schema for form input. Allows empty string for category to represent placeholder state.
 */
const formInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string(),
});

/**
 * Schema for creating a new question.
 * Title is required, description is optional, category must be explicitly selected.
 * Uses superRefine to validate category is a valid non-empty value.
 */
export const createQuestionSchema = formInputSchema.superRefine((data, ctx) => {
  if (!data.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a category',
      path: ['category'],
    });
    return;
  }
  if (!QUESTION_CATEGORIES.includes(data.category as QuestionCategory)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a valid category',
      path: ['category'],
    });
  }
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
