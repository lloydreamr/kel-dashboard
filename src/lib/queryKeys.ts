/**
 * Query Key Factory
 *
 * Centralized query key definitions for TanStack Query.
 * Using a factory pattern ensures consistent cache invalidation.
 *
 * @example
 * import { queryKeys } from '@/lib/queryKeys';
 * useQuery({ queryKey: queryKeys.questions.pending, ... });
 */
export const queryKeys = {
  questions: {
    all: ['questions'] as const,
    archived: ['questions', 'archived'] as const,
    detail: (id: string) => ['questions', id] as const,
    byStatus: (status: string) => ['questions', 'status', status] as const,
    byCategory: (category: string) => ['questions', 'category', category] as const,
  },
  decisions: {
    all: ['decisions'] as const,
    byQuestion: (questionId: string) => ['decisions', questionId] as const,
  },
  evidence: {
    all: ['evidence'] as const,
    byQuestion: (questionId: string) => ['evidence', questionId] as const,
    count: (questionId: string) => ['evidence', 'count', questionId] as const,
  },
  milestones: {
    all: ['milestones'] as const,
    byId: (id: string) => ['milestones', id] as const,
    byCategory: (category: string) => ['milestones', 'category', category] as const,
    progress: (category: string) => ['milestones', 'progress', category] as const,
  },
  milestoneNotes: {
    all: ['milestoneNotes'] as const,
    byMilestone: (milestoneId: string) => ['milestoneNotes', milestoneId] as const,
  },
  competitors: {
    all: ['competitors'] as const,
    byId: (id: string) => ['competitors', id] as const,
  },
  companies: {
    all: ['companies'] as const,
    byId: (id: string) => ['companies', id] as const,
    byCategory: (category: string) => ['companies', 'category', category] as const,
  },
  products: {
    all: ['products'] as const,
    byId: (id: string) => ['products', id] as const,
    byCategory: (category: string) => ['products', 'category', category] as const,
    byPriceTier: (tier: string) => ['products', 'priceTier', tier] as const,
  },
  researchDocs: {
    all: ['researchDocs'] as const,
    byId: (id: string) => ['researchDocs', id] as const,
    byCategory: (category: string) => ['researchDocs', 'category', category] as const,
  },
  entityConnections: {
    all: ['entityConnections'] as const,
    bySource: (type: string, id: string) =>
      ['entityConnections', 'source', type, id] as const,
    byTarget: (type: string, id: string) =>
      ['entityConnections', 'target', type, id] as const,
    related: (type: string, id: string) =>
      ['entityConnections', 'related', type, id] as const,
  },
  consumers: {
    all: ['consumers'] as const,
    byId: (id: string) => ['consumers', id] as const,
  },
  trends: {
    all: ['trends'] as const,
    byId: (id: string) => ['trends', id] as const,
    byCategory: (category: string) => ['trends', 'category', category] as const,
  },
  embeddings: {
    all: ['embeddings'] as const,
    search: (query: string) => ['embeddings', 'search', query] as const,
    byDocument: (type: string, id: string) =>
      ['embeddings', 'document', type, id] as const,
    count: (type?: string) => ['embeddings', 'count', type] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    pending: ['opportunities', 'status', 'new'] as const,
    byId: (id: string) => ['opportunities', id] as const,
    byStatus: (status: string) => ['opportunities', 'status', status] as const,
    byCategory: (category: string) => ['opportunities', 'category', category] as const,
  },
  marketIntelligence: {
    dashboardStats: ['marketIntelligence', 'dashboardStats'] as const,
    globalSearch: (query: string) =>
      ['marketIntelligence', 'globalSearch', query] as const,
  },
  pitchDrafts: {
    all: ['pitchDrafts'] as const,
    byId: (id: string) => ['pitchDrafts', id] as const,
    byStatus: (status: string) => ['pitchDrafts', 'status', status] as const,
    withSections: (id: string) => ['pitchDrafts', id, 'withSections'] as const,
  },
  pitchSections: {
    all: ['pitchSections'] as const,
    byDraft: (draftId: string) => ['pitchSections', 'draft', draftId] as const,
    byId: (id: string) => ['pitchSections', id] as const,
    byType: (draftId: string, type: string) =>
      ['pitchSections', 'draft', draftId, 'type', type] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
