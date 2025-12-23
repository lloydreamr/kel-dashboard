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
  },
  milestones: {
    all: ['milestones'] as const,
    byId: (id: string) => ['milestones', id] as const,
  },
  competitors: {
    all: ['competitors'] as const,
    byId: (id: string) => ['competitors', id] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
