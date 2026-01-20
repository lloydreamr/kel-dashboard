/**
 * Global Search Repository
 *
 * Cross-entity search across companies, products, and research documents.
 * Returns grouped results with navigation links for the command palette.
 * Limit: 5 results per type (15 max total).
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError } from './base';

/**
 * Individual search result item with navigation info
 */
export type GlobalSearchResult = {
  id: string;
  name: string;
  type: 'company' | 'product' | 'research';
  href: string;
};

/**
 * Grouped search results by entity type
 */
export type GlobalSearchResults = {
  companies: GlobalSearchResult[];
  products: GlobalSearchResult[];
  research: GlobalSearchResult[];
  totalCount: number;
};

/**
 * Global search repository - searches across knowledge base entities
 */
export const globalSearchRepo = {
  /**
   * Search all entities (companies, products, research docs) by name/title
   * Uses case-insensitive partial matching (ilike).
   *
   * @param query - Search query string (minimum 2 characters recommended)
   * @returns Grouped search results with hrefs for navigation
   * @throws RepositoryError on database errors
   *
   * @example
   * const results = await globalSearchRepo.searchAll('urc');
   * // results.companies = [{ id: '...', name: 'URC', type: 'company', href: '/market-intelligence/companies/...' }]
   */
  searchAll: async (query: string): Promise<GlobalSearchResults> => {
    const supabase = createClient();
    const searchPattern = `%${query}%`;

    // Execute all three searches in parallel for performance
    const [companiesResult, productsResult, researchResult] = await Promise.all(
      [
        supabase
          .from('companies')
          .select('id, name')
          .ilike('name', searchPattern)
          .limit(5)
          .order('name', { ascending: true }),

        supabase
          .from('products')
          .select('id, name')
          .ilike('name', searchPattern)
          .limit(5)
          .order('name', { ascending: true }),

        supabase
          .from('research_docs')
          .select('id, title')
          .ilike('title', searchPattern)
          .limit(5)
          .order('title', { ascending: true }),
      ]
    );

    // Check for errors
    if (companiesResult.error) {
      throw mapPostgrestError(companiesResult.error);
    }
    if (productsResult.error) {
      throw mapPostgrestError(productsResult.error);
    }
    if (researchResult.error) {
      throw mapPostgrestError(researchResult.error);
    }

    // Map results to GlobalSearchResult format with hrefs
    const companies: GlobalSearchResult[] = (
      companiesResult.data ?? []
    ).map((c) => ({
      id: c.id,
      name: c.name,
      type: 'company' as const,
      href: `/market-intelligence/companies/${c.id}`,
    }));

    const products: GlobalSearchResult[] = (productsResult.data ?? []).map(
      (p) => ({
        id: p.id,
        name: p.name,
        type: 'product' as const,
        href: `/market-intelligence/products/${p.id}`,
      })
    );

    const research: GlobalSearchResult[] = (researchResult.data ?? []).map(
      (r) => ({
        id: r.id,
        name: r.title,
        type: 'research' as const,
        href: `/market-intelligence/research/${r.id}`,
      })
    );

    return {
      companies,
      products,
      research,
      totalCount: companies.length + products.length + research.length,
    };
  },
};
