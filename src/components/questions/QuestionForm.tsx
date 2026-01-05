'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useCreateQuestion } from '@/hooks/questions/useCreateQuestion';
import { cn } from '@/lib/utils';

import { QuestionFormSkeleton } from './QuestionFormSkeleton';
import {
  createQuestionSchema,
  CATEGORY_OPTIONS,
  type CreateQuestionFormData,
  type QuestionCategory,
} from './questionSchema';

interface QuestionFormProps {
  /** Current user ID for created_by field */
  userId: string;
  /** Callback when user cancels the form */
  onCancel?: () => void;
  /** Callback after successful creation */
  onSuccess?: (questionId: string) => void;
}

/**
 * Form for creating a new strategic question.
 * Validates title as required, category selection, optional description.
 */
export function QuestionForm({ userId, onCancel, onSuccess }: QuestionFormProps) {
  const { mutate, isPending } = useCreateQuestion();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CreateQuestionFormData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '' as CreateQuestionFormData['category'], // Empty = no selection (placeholder)
    },
    mode: 'onChange',
  });

  const titleValue = watch('title');
  const categoryValue = watch('category');
  const isButtonDisabled = !titleValue || !categoryValue || !isValid || isPending;

  const onSubmit = (data: CreateQuestionFormData) => {
    // Category is validated by Zod schema - safe to cast
    mutate(
      {
        title: data.title,
        description: data.description || null,
        category: data.category as QuestionCategory,
        created_by: userId,
      },
      {
        onSuccess: (question) => {
          onSuccess?.(question.id);
        },
      }
    );
  };

  if (isPending) {
    return <QuestionFormSkeleton />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      data-testid="question-form"
    >
      {/* Title field */}
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-foreground"
        >
          Title <span className="text-destructive">*</span>
        </label>
        <input
          {...register('title')}
          id="title"
          type="text"
          autoFocus
          placeholder="What strategic question needs answering?"
          data-testid="question-title-input"
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {errors.title && (
          <p className="text-sm text-destructive" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={3}
          placeholder="Add context or details about this question..."
          data-testid="question-description-input"
          className="w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Category field */}
      <div className="space-y-2">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-foreground"
        >
          Category <span className="text-destructive">*</span>
        </label>
        <select
          {...register('category')}
          id="category"
          data-testid="question-category-select"
          className={cn(
            'min-h-[48px] w-full rounded-md border bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring/20',
            !categoryValue ? 'text-muted-foreground' : 'text-foreground',
            errors.category ? 'border-destructive' : 'border-border focus:border-primary'
          )}
        >
          <option value="" disabled hidden>
            Select category...
          </option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-destructive" role="alert" data-testid="category-validation-error">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="question-submit"
        >
          {isPending ? 'Creating...' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
