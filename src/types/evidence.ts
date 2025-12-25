/**
 * Evidence Domain Types
 *
 * Re-exports database types and defines domain-specific types
 * for working with evidence links attached to questions.
 */

// Re-export database types
export type { Evidence, EvidenceInsert, EvidenceUpdate } from './database';

/**
 * Input type for creating new evidence.
 * Excludes auto-generated fields (id, created_at).
 */
export interface CreateEvidenceInput {
  question_id: string;
  title: string;
  url: string;
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
 * @param url - Full URL
 * @returns Domain string (e.g., "example.com")
 */
export function extractDomain(url: string): string {
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
 * @param baseUrl - Base URL without anchor
 * @param anchor - Optional section anchor (with or without #)
 * @returns Full URL with anchor appended
 */
export function buildUrlWithAnchor(
  baseUrl: string,
  anchor?: string | null
): string {
  if (!anchor) return baseUrl;
  const cleanAnchor = anchor.startsWith('#') ? anchor : `#${anchor}`;
  return `${baseUrl}${cleanAnchor}`;
}
