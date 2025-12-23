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
