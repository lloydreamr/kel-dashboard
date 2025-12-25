'use client';

/**
 * QuestionDetailClient Component
 *
 * Client component for viewing and editing question recommendations.
 * Fetches question data and manages form state for adding/editing recommendations.
 * Tracks when Kel views questions and displays viewed indicator to Maho.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DecisionSection } from '@/components/decisions/DecisionSection';
import {
  EvidenceEditForm,
  EvidenceList,
  EvidencePanel,
  EvidenceSection,
  RemoveEvidenceDialog,
  type CreateEvidenceFormData,
} from '@/components/evidence';
import { ArchiveButton } from '@/components/questions/ArchiveButton';
import { CategoryBadge } from '@/components/questions/CategoryBadge';
import { EvidenceCountBadge } from '@/components/questions/EvidenceCountBadge';
import { KelViewedIndicator } from '@/components/questions/KelViewedIndicator';
import { RecommendationDisplay } from '@/components/questions/RecommendationDisplay';
import { RecommendationForm } from '@/components/questions/RecommendationForm';
import { SendToKelButton } from '@/components/questions/SendToKelButton';
import { StatusBadge } from '@/components/questions/StatusBadge';
import { useProfile } from '@/hooks/auth/useProfile';
import { useDecision } from '@/hooks/decisions/useDecision';
import { useDeleteEvidence } from '@/hooks/evidence/useDeleteEvidence';
import { useEvidence } from '@/hooks/evidence/useEvidence';
import { useUpdateEvidence } from '@/hooks/evidence/useUpdateEvidence';
import { useArchiveQuestion } from '@/hooks/questions/useArchiveQuestion';
import { useMarkReadyForKel } from '@/hooks/questions/useMarkReadyForKel';
import { useMarkViewed } from '@/hooks/questions/useMarkViewed';
import { useQuestion } from '@/hooks/questions/useQuestion';
import { useUpdateQuestion } from '@/hooks/questions/useUpdateQuestion';

import type { RecommendationFormData } from '@/components/questions/recommendationSchema';
import type { Evidence } from '@/types/evidence';

interface QuestionDetailClientProps {
  questionId: string;
}

export function QuestionDetailClient({
  questionId,
}: QuestionDetailClientProps) {
  const router = useRouter();
  const { data: question, isLoading, error } = useQuestion(questionId);
  const { data: profile } = useProfile();
  const { mutate: updateQuestion, isPending } = useUpdateQuestion();
  const { mutate: archiveQuestion, isPending: isArchiving } = useArchiveQuestion();
  const { markReadyForKel, isPending: isSending } = useMarkReadyForKel();
  const { markViewed, hasMarked } = useMarkViewed();
  const { data: evidence, isLoading: isEvidenceLoading } = useEvidence(questionId);
  const { mutate: updateEvidence, isPending: isUpdating } = useUpdateEvidence(questionId);
  const { mutate: deleteEvidence, isPending: isDeleting } = useDeleteEvidence(questionId);
  const { data: decision } = useDecision(questionId);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [removingEvidence, setRemovingEvidence] = useState<Evidence | null>(null);

  const evidenceCount = evidence?.length ?? 0;

  const hasRecommendation = !!question?.recommendation;
  const isDraft = question?.status === 'draft';
  const isArchived = question?.status === 'archived';
  const isKel = profile?.role === 'kel';
  const isMaho = profile?.role === 'maho';

  const handleArchive = () => {
    archiveQuestion(questionId, {
      onSuccess: () => {
        router.push('/questions');
      },
    });
  };

  // Mark question as viewed by Kel (once per session)
  useEffect(() => {
    if (isKel && question && !hasMarked(questionId)) {
      markViewed(questionId);
    }
  }, [isKel, question, questionId, markViewed, hasMarked]);

  const handleSubmitRecommendation = (data: RecommendationFormData) => {
    updateQuestion(
      {
        id: questionId,
        updates: {
          recommendation: data.recommendation,
          recommendation_rationale: data.recommendation_rationale ?? null,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleEditEvidence = (data: CreateEvidenceFormData) => {
    if (!editingEvidence) return;
    updateEvidence(
      {
        id: editingEvidence.id,
        updates: {
          title: data.title,
          url: data.url,
          section_anchor: data.section_anchor,
          excerpt: data.excerpt,
        },
      },
      {
        onSuccess: () => {
          setEditingEvidence(null);
        },
      }
    );
  };

  const handleRemoveEvidence = () => {
    if (!removingEvidence) return;
    deleteEvidence(removingEvidence.id, {
      onSuccess: () => {
        setRemovingEvidence(null);
        // Close panel if this evidence was being viewed
        if (selectedEvidence?.id === removingEvidence.id) {
          setSelectedEvidence(null);
        }
      },
    });
  };

  if (isLoading) {
    return <QuestionDetailSkeleton />;
  }

  if (error || !question) {
    return (
      <main
        data-testid="question-detail-page"
        className="min-h-screen bg-background px-4 py-6"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-destructive">Failed to load question</p>
          <Link href="/questions" className="text-primary underline">
            Back to Questions
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      data-testid="question-detail-page"
      className="min-h-screen bg-background px-4 py-6"
    >
      <div data-testid="question-detail" className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/questions"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Questions
        </Link>

        {/* Question details */}
        <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CategoryBadge
                questionId={questionId}
                category={question.category}
                isEditable={isMaho && !isArchived}
              />
              <StatusBadge
                status={question.status}
                decisionType={decision?.decision_type}
                isPending={isSending}
              />
              <EvidenceCountBadge count={evidenceCount} />
            </div>

            {/* Kel viewed indicator (shown to Maho only) */}
            {isMaho && question.viewed_by_kel_at && (
              <KelViewedIndicator viewedAt={question.viewed_by_kel_at} />
            )}
          </div>

          <h1
            data-testid="question-title"
            className="text-xl font-semibold text-foreground"
          >
            {question.title}
          </h1>

          {question.description && (
            <p className="text-foreground">{question.description}</p>
          )}

          {/* Archive action (Maho only, non-archived questions) */}
          {isMaho && !isArchived && (
            <div className="pt-2 border-t border-border">
              <ArchiveButton onConfirm={handleArchive} isPending={isArchiving} />
            </div>
          )}
        </div>

        {/* Recommendation section */}
        <div data-testid="question-recommendation" className="mt-6">
          {!hasRecommendation && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              data-testid="add-recommendation-button"
              className="w-full rounded-md border-2 border-dashed border-border bg-background px-4 py-6 min-h-[48px] text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
            >
              + Add Recommendation
            </button>
          )}

          {isEditing && (
            <RecommendationForm
              initialValues={
                hasRecommendation
                  ? {
                      recommendation: question.recommendation!,
                      recommendation_rationale: question.recommendation_rationale,
                    }
                  : undefined
              }
              onSubmit={handleSubmitRecommendation}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isPending}
            />
          )}

          {hasRecommendation && !isEditing && (
            <RecommendationDisplay
              recommendation={question.recommendation!}
              rationale={question.recommendation_rationale}
              onEdit={() => setIsEditing(true)}
              isPending={isPending}
            />
          )}

          {/* Send to Kel button (only for draft status) */}
          {isDraft && (
            <div className="mt-6">
              <SendToKelButton
                hasRecommendation={hasRecommendation}
                onConfirm={() => markReadyForKel(questionId, question.status)}
                isPending={isSending}
              />
            </div>
          )}

          {/* Evidence list */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Supporting Evidence
            </h3>
            <EvidenceList
              evidence={evidence}
              isLoading={isEvidenceLoading}
              role={isKel ? 'kel' : 'maho'}
              onItemClick={(item) => setSelectedEvidence(item)}
              onEditClick={(item) => setEditingEvidence(item)}
              onRemoveClick={(item) => setRemovingEvidence(item)}
            />

            {/* Edit evidence form (shown when editing) */}
            {editingEvidence && (
              <div className="mt-4">
                <EvidenceEditForm
                  evidence={editingEvidence}
                  onCancel={() => setEditingEvidence(null)}
                  onSubmit={handleEditEvidence}
                  isSubmitting={isUpdating}
                />
              </div>
            )}
          </div>

          {/* Evidence section (Maho only) */}
          {isMaho && !isArchived && profile?.id && (
            <EvidenceSection
              questionId={questionId}
              userId={profile.id}
              canAdd={isMaho}
            />
          )}
        </div>

        {/* Decision section (Story 4-7) */}
        <div className="mt-6">
          <DecisionSection
            questionId={questionId}
            questionStatus={question.status}
          />
        </div>
      </div>

      {/* Evidence Panel */}
      <EvidencePanel
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />

      {/* Remove Evidence Dialog */}
      <RemoveEvidenceDialog
        open={!!removingEvidence}
        onOpenChange={(open) => !open && setRemovingEvidence(null)}
        evidenceTitle={removingEvidence?.title ?? ''}
        onConfirm={handleRemoveEvidence}
        isPending={isDeleting}
      />
    </main>
  );
}

/**
 * Loading skeleton for question detail page
 */
function QuestionDetailSkeleton() {
  return (
    <main
      data-testid="question-detail-skeleton"
      className="min-h-screen bg-background px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        {/* Back link skeleton */}
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />

        {/* Question card skeleton */}
        <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
          {/* Category and status badges */}
          <div className="flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
          </div>
          {/* Title */}
          <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Recommendation section skeleton */}
        <div className="mt-6">
          <div className="h-20 w-full animate-pulse rounded-md border-2 border-dashed border-muted bg-muted/20" />
        </div>
      </div>
    </main>
  );
}
