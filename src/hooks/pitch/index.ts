/**
 * Pitch Hooks
 *
 * TanStack Query hooks for pitch draft and section management.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

// Query hooks
export { usePitchDrafts } from './usePitchDrafts';
export { usePitchDraft } from './usePitchDraft';
export { usePitchSections } from './usePitchSections';

// Mutation hooks - drafts
export {
  useCreatePitchDraft,
  useUpdatePitchDraft,
  useUpdatePitchDraftStatus,
  useDeletePitchDraft,
} from './usePitchDraftMutations';

// Mutation hooks - sections
export {
  useUpdatePitchSection,
  useDeletePitchSection,
} from './usePitchSectionMutations';

// AI generation
export {
  useGeneratePitchContent,
  getGenerationState,
  type GenerationState,
} from './useGeneratePitchContent';

// AI summary generation (Story 18-3)
export { useGeneratePitchSummary } from './useGeneratePitchSummary';
