'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useAddEvidence } from '@/hooks/evidence/useAddEvidence';

import {
  createEvidenceSchema,
  type CreateEvidenceFormData,
  type CreateEvidenceFormInput,
} from './evidenceSchema';

interface EvidenceFormProps {
  /** Question ID to attach evidence to */
  questionId: string;
  /** Current user ID for created_by field */
  userId: string;
  /** Callback when user cancels the form */
  onCancel: () => void;
  /** Callback after successful creation */
  onSuccess?: () => void;
}

/**
 * Form for attaching evidence to a strategic question.
 * Validates URL format client-side before submission.
 */
export function EvidenceForm({
  questionId,
  userId,
  onCancel,
  onSuccess,
}: EvidenceFormProps) {
  const { mutate: addEvidence, isPending } = useAddEvidence(questionId);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<CreateEvidenceFormInput, unknown, CreateEvidenceFormData>({
    resolver: zodResolver(createEvidenceSchema),
    defaultValues: {
      title: '',
      url: '',
      section_anchor: '',
      excerpt: '',
    },
    mode: 'onChange',
  });

  const titleValue = watch('title');
  const urlValue = watch('url');
  const isButtonDisabled = !titleValue || !urlValue || !isValid || isPending;

  const onSubmit = (data: CreateEvidenceFormData) => {
    addEvidence(
      {
        title: data.title,
        url: data.url,
        section_anchor: data.section_anchor ?? null,
        excerpt: data.excerpt ?? null,
        created_by: userId,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-border bg-surface p-4"
      data-testid="evidence-form"
    >
      <h3 className="text-sm font-medium text-foreground">Add Evidence</h3>

      {/* Title field */}
      <div className="space-y-2">
        <label
          htmlFor="evidence-title"
          className="block text-sm font-medium text-foreground"
        >
          Title <span className="text-destructive">*</span>
        </label>
        <input
          {...register('title')}
          id="evidence-title"
          type="text"
          autoFocus
          placeholder="e.g., PSA Market Research Report 2024"
          data-testid="evidence-title-input"
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {errors.title && (
          <p className="text-sm text-destructive" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* URL field */}
      <div className="space-y-2">
        <label
          htmlFor="evidence-url"
          className="block text-sm font-medium text-foreground"
        >
          URL <span className="text-destructive">*</span>
        </label>
        <input
          {...register('url')}
          id="evidence-url"
          type="url"
          placeholder="https://example.com/source"
          data-testid="evidence-url-input"
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {errors.url && (
          <p className="text-sm text-destructive" role="alert">
            {errors.url.message}
          </p>
        )}
      </div>

      {/* Section anchor field (optional) */}
      <div className="space-y-2">
        <label
          htmlFor="evidence-anchor"
          className="block text-sm font-medium text-foreground"
        >
          Section Anchor{' '}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          {...register('section_anchor')}
          id="evidence-anchor"
          type="text"
          placeholder="#section-name"
          data-testid="evidence-anchor-input"
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {errors.section_anchor && (
          <p className="text-sm text-destructive" role="alert">
            {errors.section_anchor.message}
          </p>
        )}
      </div>

      {/* Excerpt field (optional) */}
      <div className="space-y-2">
        <label
          htmlFor="evidence-excerpt"
          className="block text-sm font-medium text-foreground"
        >
          Excerpt <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          {...register('excerpt')}
          id="evidence-excerpt"
          rows={3}
          placeholder="What does this source prove?"
          data-testid="evidence-excerpt-input"
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {errors.excerpt && (
          <p className="text-sm text-destructive" role="alert">
            {errors.excerpt.message}
          </p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="min-h-[48px] rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="evidence-submit"
          className="min-h-[48px] rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add Evidence'}
        </button>
      </div>
    </form>
  );
}
