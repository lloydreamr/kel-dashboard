/**
 * Product Domain Types
 *
 * Re-exports product types from database and defines filter key types.
 */

import type { Database } from './database';

/** Product row from database */
export type Product = Database['public']['Tables']['products']['Row'];

/** Insert type for new products */
export type ProductInsert = Database['public']['Tables']['products']['Insert'];

/** Update type for product modifications */
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

/** Product with joined company name for display */
export type { ProductWithCompany } from '@/lib/repositories/products';

/** Category filter key for product filtering */
export type ProductCategoryFilterKey = 'all' | 'puffed' | 'chips' | 'nuts' | 'crackers' | 'others';

/** Price tier filter key for product filtering */
export type PriceTierFilterKey = 'all' | 'value' | 'mainstream' | 'premium';

/** Human-readable labels for product categories */
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryFilterKey, string> = {
  all: 'All',
  puffed: 'Puffed',
  chips: 'Chips',
  nuts: 'Nuts',
  crackers: 'Crackers',
  others: 'Others',
} as const;

/** Human-readable labels for price tiers */
export const PRICE_TIER_LABELS: Record<PriceTierFilterKey, string> = {
  all: 'All',
  value: 'Value',
  mainstream: 'Mainstream',
  premium: 'Premium',
} as const;
