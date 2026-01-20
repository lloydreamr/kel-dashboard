/**
 * Products Repository
 *
 * All database operations for products from the knowledge base.
 * Uses browser client for client-side operations.
 * Includes JOIN with companies table for company name display.
 * RLS ensures only authenticated users can access product data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError, RepositoryError, RepositoryErrorCode } from './base';

import type { Database } from '@/types/database';

type ProductRow = Database['public']['Tables']['products']['Row'];

/**
 * Product with joined company name for display (AC #1: "company name if available")
 */
export type ProductWithCompany = ProductRow & {
  companies: { name: string } | null;
};

/**
 * Products repository - handles all product data CRUD operations
 */
export const productsRepo = {
  /**
   * Get all products WITH company names
   * Returns products ordered by name alphabetically
   * Joins companies table to get company name for display
   *
   * @returns Array of all products with company names
   * @throws RepositoryError on database errors
   */
  getAll: async (): Promise<ProductWithCompany[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, companies(name)')
      .order('name', { ascending: true });

    if (error) {
      throw mapPostgrestError(error);
    }

    return (data ?? []) as ProductWithCompany[];
  },

  /**
   * Get a single product by ID with company name
   *
   * @param id - Product UUID
   * @returns Product with company name
   * @throws RepositoryError if not found or access denied
   */
  getById: async (id: string): Promise<ProductWithCompany> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, companies(name)')
      .eq('id', id)
      .single();

    if (error) {
      throw mapPostgrestError(error);
    }

    if (!data) {
      throw new RepositoryError(
        'Product not found',
        RepositoryErrorCode.NOT_FOUND
      );
    }

    return data as ProductWithCompany;
  },
};

// Export the Product type for use in components
export type { ProductWithCompany as Product };
