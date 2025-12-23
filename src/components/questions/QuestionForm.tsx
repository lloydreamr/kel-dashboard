'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useCreateQuestion } from '@/hooks/questions/useCreateQuestion';

import { QuestionFormSkeleton } from './QuestionFormSkeleton';
import {
  createQuestionSchema,
  CATEGORY_OPTIONS,
  type CreateQuestionFormData,
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
      category: 'product', // Default category
    },
    mode: 'onChange',
  });

  const titleValue = watch('title');
  const isButtonDisabled = !titleValue || !isValid || isPending;

  const onSubmit = (data: CreateQuestionFormData) => {
    mutate(
      {
        title: data.title,
        description: data.description || null,
        category: data.category,
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
          Category
        </label>
        <select
          {...register('category')}
          id="category"
          data-testid="question-category-select"
          className="min-h-[48px] w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="question-submit"
          className="min-h-[48px] rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Question'}
        </button>
      </div>
    </form>
  );
}
