'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  createEvidenceSchema,
  type CreateEvidenceFormData,
  type CreateEvidenceFormInput,
} from './evidenceSchema';

import type { Evidence } from '@/types/evidence';

interface EvidenceEditFormProps {
  /** Evidence being edited */
  evidence: Evidence;
  /** Callback when user cancels the form */
  onCancel: () => void;
  /** Callback when form is submitted with updates */
  onSubmit: (data: CreateEvidenceFormData) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

/**
 * Form for editing existing evidence.
 * Pre-fills with current values and validates before submission.
 */
export function EvidenceEditForm({
  evidence,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: EvidenceEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
  } = useForm<CreateEvidenceFormInput, unknown, CreateEvidenceFormData>({
    resolver: zodResolver(createEvidenceSchema),
    defaultValues: {
      title: evidence.title,
      url: evidence.url,
      section_anchor: evidence.section_anchor ?? '',
      excerpt: evidence.excerpt ?? '',
    },
    mode: 'onChange',
  });

  const titleValue = watch('title');
  const urlValue = watch('url');
  const isButtonDisabled =
    !titleValue || !urlValue || !isValid || !isDirty || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-border bg-surface p-4"
      data-testid="evidence-edit-form"
    >
      <h3 className="text-sm font-medium text-foreground">Edit Evidence</h3>

      {/* Title field */}
      <div className="space-y-2">
        <label
          htmlFor="edit-evidence-title"
          className="block text-sm font-medium text-foreground"
        >
          Title <span className="text-destructive">*</span>
        </label>
        <input
          {...register('title')}
          id="edit-evidence-title"
          type="text"
          autoFocus
          data-testid="evidence-edit-title-input"
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
          htmlFor="edit-evidence-url"
          className="block text-sm font-medium text-foreground"
        >
          URL <span className="text-destructive">*</span>
        </label>
        <input
          {...register('url')}
          id="edit-evidence-url"
          type="url"
          data-testid="evidence-edit-url-input"
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
          htmlFor="edit-evidence-anchor"
          className="block text-sm font-medium text-foreground"
        >
          Section Anchor{' '}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          {...register('section_anchor')}
          id="edit-evidence-anchor"
          type="text"
          placeholder="#section-name"
          data-testid="evidence-edit-anchor-input"
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
          htmlFor="edit-evidence-excerpt"
          className="block text-sm font-medium text-foreground"
        >
          Excerpt <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          {...register('excerpt')}
          id="edit-evidence-excerpt"
          rows={3}
          placeholder="What does this source prove?"
          data-testid="evidence-edit-excerpt-input"
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
          disabled={isSubmitting}
          className="min-h-[48px] rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isButtonDisabled}
          data-testid="evidence-edit-submit"
          className="min-h-[48px] rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
