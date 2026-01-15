/**
 * Hooks Index
 *
 * Barrel export for all custom hooks.
 * Import from '@/hooks' for stateful logic.
 *
 * @example
 * import { useQuestions, useMilestones } from '@/hooks';
 */

// Auth hooks
export { useSignInWithOtp } from './auth/useAuth';
export { useProfile } from './auth/useProfile';

// Question hooks
export { useQuestions } from './questions/useQuestions';

// Milestone hooks
export {
  useMilestones,
  useMilestoneProgress,
  useMilestoneNotes,
  useUpdateMilestone,
  useMarkMilestoneComplete,
  useCreateMilestoneNote,
  useUpdateMilestoneNote,
  useDeleteMilestoneNote,
} from './milestones';

// Opportunity hooks
export { useOpportunities, useFilteredOpportunities } from './opportunities';

// Pitch hooks
export {
  usePitchDrafts,
  usePitchDraft,
  usePitchSections,
  useCreatePitchDraft,
  useUpdatePitchDraft,
  useUpdatePitchDraftStatus,
  useDeletePitchDraft,
  useUpdatePitchSection,
  useDeletePitchSection,
  useGeneratePitchContent,
  getGenerationState,
  type GenerationState,
} from './pitch';
