'use client';

/**
 * useDashboardStats Hook
 *
 * Aggregates stats from companies, products, research docs, and opportunities
 * for the Market Intelligence landing dashboard.
 * Returns counts, recent opportunities, and last updated timestamp.
 */

import { useMemo } from 'react';

import { useCompanies } from '@/hooks/companies';
import { useOpportunities } from '@/hooks/opportunities';
import { useProducts } from '@/hooks/products';
import { useQuestions } from '@/hooks/questions';
import { useResearchDocs } from '@/hooks/research';

import type { Opportunity } from '@/lib/repositories/opportunities';

export interface DashboardStats {
  counts: {
    companies: number;
    products: number;
    research: number;
    questions: number;
  };
  recentOpportunities: Opportunity[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching aggregated dashboard statistics.
 * Combines data from companies, products, research docs, and opportunities.
 *
 * @returns Dashboard stats with counts, recent opportunities, and last updated
 *
 * @example
 * const { counts, recentOpportunities, lastUpdated, isLoading, error } = useDashboardStats();
 */
export function useDashboardStats(): DashboardStats {
  const { data: companies, isLoading: companiesLoading, error: companiesError } = useCompanies();
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: researchDocs, isLoading: researchLoading, error: researchError } = useResearchDocs();
  const { data: opportunities, isLoading: opportunitiesLoading, error: opportunitiesError } = useOpportunities();
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuestions();

  // Combine loading states
  const isLoading = companiesLoading || productsLoading || researchLoading || opportunitiesLoading || questionsLoading;

  // First error wins
  const error = companiesError || productsError || researchError || opportunitiesError || questionsError || null;

  // Calculate counts - memoized to prevent object recreation
  const counts = useMemo(
    () => ({
      companies: companies?.length ?? 0,
      products: products?.length ?? 0,
      research: researchDocs?.length ?? 0,
      questions: questions?.length ?? 0,
    }),
    [companies?.length, products?.length, researchDocs?.length, questions?.length]
  );

  // Get top 3 opportunities by confidence score (already sorted from useOpportunities)
  const recentOpportunities = useMemo(
    () => opportunities?.slice(0, 3) ?? [],
    [opportunities]
  );

  // Calculate last updated from most recent updated_at across all entities
  // Memoized to avoid recalculation on every render
  const lastUpdated = useMemo(
    () =>
      calculateLastUpdated(
        companies ?? [],
        products ?? [],
        researchDocs ?? [],
        opportunities ?? [],
        questions ?? []
      ),
    [companies, products, researchDocs, opportunities, questions]
  );

  return {
    counts,
    recentOpportunities,
    lastUpdated,
    isLoading,
    error,
  };
}

/**
 * Calculate the most recent updated_at timestamp across all entity types
 */
function calculateLastUpdated(
  companies: { updated_at?: string | null }[],
  products: { updated_at?: string | null }[],
  researchDocs: { updated_at?: string | null }[],
  opportunities: { updated_at?: string | null }[],
  questions: { updated_at?: string | null }[]
): Date | null {
  const allDates: Date[] = [];

  // Collect all valid updated_at dates
  const collectDates = (entities: { updated_at?: string | null }[]) => {
    for (const entity of entities) {
      if (entity.updated_at) {
        const date = new Date(entity.updated_at);
        if (!isNaN(date.getTime())) {
          allDates.push(date);
        }
      }
    }
  };

  collectDates(companies);
  collectDates(products);
  collectDates(researchDocs);
  collectDates(opportunities);
  collectDates(questions);

  if (allDates.length === 0) {
    return null;
  }

  // Return the most recent date
  return new Date(Math.max(...allDates.map(d => d.getTime())));
}
