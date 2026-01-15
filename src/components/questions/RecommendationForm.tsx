'use client';

/**
 * RecommendationForm Component
 *
 * Form for adding or editing a recommendation on a question.
 * Uses react-hook-form with Zod validation.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';

import {
  recommendationSchema,
  type RecommendationFormData,
} from './recommendationSchema';

interface RecommendationFormProps {
  /** Initial values for edit mode */
  initialValues?: {
    recommendation: string;
    recommendation_rationale?: string | null;
  };
  /** Callback when form is submitted */
  onSubmit: (data: RecommendationFormData) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
}

export function RecommendationForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RecommendationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      recommendation: initialValues?.recommendation ?? '',
      recommendation_rationale: initialValues?.recommendation_rationale ?? '',
    },
    mode: 'onChange',
  });

  const recommendationValue = watch('recommendation');
  const isButtonDisabled = !recommendationValue || !isValid || isSubmitting;
  const isEditMode = !!initialValues;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      data-testid="recommendation-form"
    >
      {/* Recommendation textarea */}
      <div className="space-y-2">
        <label
          htmlFor="recommendation"
          className="text-sm font-medium text-foreground"
        >
          Recommendation *
        </label>
        <textarea
          {...register('recommendation')}
          id="recommendation"
          data-testid="recommendation-text"
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="What do you recommend?"
        />
        {errors.recommendation && (
          <p className="text-sm text-destructive">
            {errors.recommendation.message}
          </p>
        )}
      </div>

      {/* Rationale textarea */}
      <div className="space-y-2">
        <label
          htmlFor="rationale"
          className="text-sm font-medium text-foreground"
        >
          Rationale <span className="text-muted-foreground">(encouraged)</span>
        </label>
        <textarea
          {...register('recommendation_rationale')}
          id="rationale"
          data-testid="recommendation-rationale"
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Why do you recommend this?"
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="recommendation-submit"
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
