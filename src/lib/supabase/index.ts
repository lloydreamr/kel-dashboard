/**
 * Supabase Client Utilities
 *
 * Provides typed Supabase clients for both browser and server contexts.
 * Always import from this module - never create clients directly.
 *
 * @example
 * // In a Client Component
 * import { createClient } from '@/lib/supabase/client';
 *
 * // In a Server Component or Route Handler
 * import { createClient } from '@/lib/supabase/server';
 *
 * // In middleware.ts
 * import { updateSession } from '@/lib/supabase/middleware';
 */

export { createClient as createBrowserClient } from './client';
export { updateSession } from './middleware';
export { createClient as createServerClient } from './server';

export type { UpdateSessionResult } from './middleware';
