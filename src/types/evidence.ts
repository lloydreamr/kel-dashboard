/**
 * Evidence Domain Types
 *
 * Re-exports database types and defines domain-specific types
 * for working with evidence links attached to questions.
 */

// Re-export database types
export type { Evidence, EvidenceInsert, EvidenceUpdate } from './database';

/**
 * Input type for creating new URL-based evidence.
 * Excludes auto-generated fields (id, created_at).
 */
export interface CreateEvidenceInput {
  question_id?: string | null;
  title: string;
  url: string;
  image_url?: null;
  source_type?: 'url';
  section_anchor?: string | null;
  excerpt?: string | null;
  created_by: string;
}

/**
 * Input type for creating new photo evidence (quick capture).
 */
export interface CreatePhotoEvidenceInput {
  question_id?: string | null;
  title: string;
  url?: null;
  image_url: string;
  source_type: 'photo';
  section_anchor?: string | null;
  excerpt?: string | null;
  created_by: string;
}

/**
 * Input type for updating evidence.
 * All fields optional.
 */
export interface UpdateEvidenceInput {
  title?: string;
  url?: string;
  section_anchor?: string | null;
  excerpt?: string | null;
}

/**
 * Validates a URL for evidence attachment.
 * Rejects dangerous protocols and validates format.
 *
 * @param url - URL string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEvidenceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts domain from a URL for display.
 *
 * @param url - Full URL (or null for photo evidence)
 * @returns Domain string (e.g., "example.com") or 'Photo' for null URL
 */
export function extractDomain(url: string | null): string {
  if (!url) return 'Photo';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Constructs full URL with optional section anchor.
 *
 * @param baseUrl - Base URL without anchor (or null for photo evidence)
 * @param anchor - Optional section anchor (with or without #)
 * @returns Full URL with anchor appended, or null if no base URL
 */
export function buildUrlWithAnchor(
  baseUrl: string | null,
  anchor?: string | null
): string | null {
  if (!baseUrl) return null;
  if (!anchor) return baseUrl;
  const cleanAnchor = anchor.startsWith('#') ? anchor : `#${anchor}`;
  return `${baseUrl}${cleanAnchor}`;
}
