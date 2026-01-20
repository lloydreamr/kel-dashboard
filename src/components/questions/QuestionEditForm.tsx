'use client';

/**
 * QuestionEditForm Component
 *
 * Form for editing a question's title and description.
 * Uses react-hook-form with Zod validation.
 * Follows the same pattern as RecommendationForm.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Schema for question edit form
const questionEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
});

export type QuestionEditFormData = z.infer<typeof questionEditSchema>;

interface QuestionEditFormProps {
  /** Initial values for the form */
  initialValues: {
    title: string;
    description: string | null;
  };
  /** Callback when form is submitted */
  onSubmit: (data: QuestionEditFormData) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

export function QuestionEditForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: QuestionEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<QuestionEditFormData>({
    resolver: zodResolver(questionEditSchema),
    defaultValues: {
      title: initialValues.title,
      description: initialValues.description ?? '',
    },
    mode: 'onChange',
  });

  const titleValue = watch('title');
  const isButtonDisabled = !titleValue || !isValid || isSubmitting;

  // Handle Escape key to cancel editing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleFormSubmit = (data: QuestionEditFormData) => {
    // Convert empty string description to null
    onSubmit({
      ...data,
      description: data.description?.trim() || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      data-testid="question-edit-form"
    >
      {/* Title input */}
      <div className="space-y-2">
        <label
          htmlFor="question-edit-title"
          className="text-sm font-medium text-foreground"
        >
          Title *
        </label>
        <Input
          {...register('title')}
          id="question-edit-title"
          data-testid="question-edit-title"
          placeholder="Question title"
          className="w-full"
        />
        {errors.title && (
          <p className="text-sm text-destructive" data-testid="title-error">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description textarea */}
      <div className="space-y-2">
        <label
          htmlFor="question-edit-description"
          className="text-sm font-medium text-foreground"
        >
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          {...register('description')}
          id="question-edit-description"
          data-testid="question-edit-description"
          rows={3}
          placeholder="Additional context or details"
          className="w-full"
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          data-testid="question-edit-cancel"
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="question-edit-save"
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
