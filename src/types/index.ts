/**
 * Shared TypeScript Types
 *
 * Central location for application-wide type definitions.
 * Database types are generated from Supabase schema.
 */

// Re-export database types
export type {
  Database,
  Tables,
  InsertTables,
  UpdateTables,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Question,
  QuestionInsert,
  QuestionUpdate,
} from './database';

// Re-export question domain types
export type {
  QuestionStatus,
  QuestionCategory,
  CreateQuestionInput,
  UpdateQuestionInput,
} from './question';

import type { Profile } from './database';

/** User roles in the application - derived from database schema */
export type UserRole = Profile['role'];

/** Base entity with common fields */
export type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/** API response wrapper */
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

// Additional types will be added as features are implemented
