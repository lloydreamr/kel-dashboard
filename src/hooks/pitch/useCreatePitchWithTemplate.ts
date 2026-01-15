/**
 * useCreatePitchWithTemplate Hook
 *
 * Creates a pitch draft with template-based sections in a single operation.
 * When a template is selected, automatically creates sections with placeholder content.
 *
 * Story 18-4: Pitch Template Library
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { getTemplateSections } from '@/lib/pitch';
import { pitchDraftsRepo, pitchSectionsRepo } from '@/lib/repositories';

import type { PitchDraft, PitchSection } from '@/types/database';
import type { CreatePitchDraftInput, PitchTemplateType } from '@/types/pitch';

/**
 * Result of creating a pitch with template
 */
export interface CreatePitchWithTemplateResult {
  /** The created pitch draft */
  draft: PitchDraft;
  /** Sections created from template (empty if no template) */
  sections: PitchSection[];
}

/**
 * Hook for creating a pitch draft with template-based sections.
 *
 * When `template_type` is specified in the input:
 * 1. Creates the pitch draft
 * 2. Creates sections from the template with placeholder content
 *
 * When `template_type` is null (custom pitch):
 * 1. Creates only the pitch draft (no sections)
 *
 * @returns Mutation for creating pitch with template
 *
 * @example
 * const createPitch = useCreatePitchWithTemplate();
 *
 * // Create with template
 * createPitch.mutate({
 *   title: 'EFC Pitch',
 *   template_type: 'mid_size'
 * });
 *
 * // Create custom (no template)
 * createPitch.mutate({
 *   title: 'Custom Pitch',
 *   template_type: null
 * });
 */
export function useCreatePitchWithTemplate() {
  const queryClient = useQueryClient();

  return useMutation<CreatePitchWithTemplateResult, Error, CreatePitchDraftInput>({
    mutationFn: async (input) => {
      // Step 1: Create the pitch draft
      const draft = await pitchDraftsRepo.create(input);

      // Step 2: Create template sections if a template is selected
      const templateType = input.template_type as PitchTemplateType;
      const templateSections = getTemplateSections(templateType);

      let sections: PitchSection[] = [];
      if (templateSections.length > 0) {
        try {
          sections = await pitchSectionsRepo.createBatch(
            draft.id,
            templateSections.map((section) => ({
              section_type: section.type,
              content: section.placeholder,
              ai_generated: false,
              user_edited: false,
              confidence_score: null,
            }))
          );
        } catch (sectionError) {
          // Rollback: Delete the orphan draft if section creation fails
          // This prevents partial state where draft exists without expected sections
          try {
            await pitchDraftsRepo.delete(draft.id);
          } catch {
            // Log but don't mask the original error
            console.error('Failed to rollback draft after section creation error');
          }
          throw sectionError;
        }
      }

      return { draft, sections };
    },
    onSuccess: ({ draft, sections }) => {
      // Invalidate drafts list to show new draft with section count
      queryClient.invalidateQueries({ queryKey: queryKeys.pitchDrafts.all });

      // Build success message
      const sectionCount = sections.length;
      const message =
        sectionCount > 0
          ? `Created "${draft.title}" with ${sectionCount} sections`
          : `Created "${draft.title}"`;

      toast.success(message);
    },
    onError: (error) => {
      toast.error('Failed to create pitch', {
        description: error.message,
      });
    },
  });
}
