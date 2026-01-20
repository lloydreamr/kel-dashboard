/**
 * Repository Layer
 *
 * Barrel export for all repositories.
 * Import from '@/lib/repositories' for database operations.
 *
 * IMPORTANT: Never call Supabase directly in components.
 * Always use these repository functions.
 *
 * @example
 * import { profilesRepo } from '@/lib/repositories';
 * const profile = await profilesRepo.getCurrent();
 */

// Repositories
export { profilesRepo } from './profiles';
export { questionsRepo } from './questions';
export { milestonesRepo, milestoneNotesRepo } from './milestones';
export { companiesRepo } from './companies';
export { productsRepo } from './products';
export { researchDocsRepo } from './researchDocs';
export { entityConnectionsRepo } from './entityConnections';
export { consumersRepo } from './consumers';
export { trendsRepo } from './trends';
export { embeddingsRepo } from './embeddings';
export { opportunitiesRepo } from './opportunities';
export { globalSearchRepo } from './globalSearch';
export { pitchDraftsRepo } from './pitchDrafts';
export { pitchSectionsRepo, pitchSectionSourcesRepo } from './pitchSections';

// Error handling utilities
export {
  RepositoryError,
  RepositoryErrorCode,
  isRepositoryError,
  isNotFoundError,
  isUnauthorizedError,
  mapPostgrestError,
} from './base';

// Types
export type { Profile, ProfileUpdate } from './profiles';
export type {
  Question,
  CreateQuestionInput,
  UpdateQuestionInput,
  QuestionStatus,
  QuestionCategory,
} from './questions';

export type { Company } from './companies';
export type { Product, ProductWithCompany } from './products';
export type { ResearchDoc } from './researchDocs';
export type { EntityConnection, EntityType } from './entityConnections';
export type { Consumer } from './consumers';
export type { Trend } from './trends';
export type { DocumentType, EmbeddingChunk, SearchResult } from './embeddings';
export type {
  Opportunity,
  OpportunityCategory,
  OpportunityStatus,
  OpportunityInput,
  SupportingEvidence,
} from './opportunities';
export type { GlobalSearchResult, GlobalSearchResults } from './globalSearch';
export type {
  PitchDraft,
  PitchDraftStatus,
  PitchTemplateType,
  CreatePitchDraftInput,
  UpdatePitchDraftInput,
  PitchDraftWithSections,
} from './pitchDrafts';
export type {
  PitchSection,
  PitchSectionSource,
  PitchSectionType,
  PitchSourceType,
  CreatePitchSectionInput,
  UpdatePitchSectionInput,
  CreatePitchSectionSourceInput,
  PitchSectionWithSources,
} from './pitchSections';
