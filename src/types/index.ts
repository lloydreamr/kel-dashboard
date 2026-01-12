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
  Milestone,
  MilestoneInsert,
  MilestoneUpdate,
  MilestoneNote,
  MilestoneNoteInsert,
  MilestoneNoteUpdate,
  CompetitorDataPoint,
  CompetitorDataPointInsert,
  CompetitorDataPointUpdate,
} from './database';

// Re-export question domain types
export type {
  QuestionStatus,
  QuestionCategory,
  CreateQuestionInput,
  UpdateQuestionInput,
} from './question';

// Re-export milestone domain types
export type {
  ClarityCategory,
  MilestoneStatus,
  MilestoneProgress,
  CreateMilestoneNoteInput,
  UpdateMilestoneNoteInput,
  UpdateMilestoneStatusInput,
  MarkMilestoneCompleteInput,
} from './milestone';

// Re-export competitor domain types
export type {
  CreateCompetitorInput,
  UpdateCompetitorInput,
} from './competitor';

// Re-export company domain types
export type {
  Company,
  CompanyInsert,
  CompanyUpdate,
  CategoryFilterKey,
} from './company';
export { CATEGORY_LABELS } from './company';

// Re-export product domain types
export type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductWithCompany,
  ProductCategoryFilterKey,
  PriceTierFilterKey,
} from './product';
export { PRODUCT_CATEGORY_LABELS, PRICE_TIER_LABELS } from './product';

// Re-export research doc domain types
export type {
  ResearchDoc,
  ResearchDocInsert,
  ResearchDocUpdate,
  ResearchCategoryFilterKey,
} from './researchDoc';
export { RESEARCH_CATEGORY_LABELS } from './researchDoc';

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
