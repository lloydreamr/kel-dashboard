-- Story 10.5: Quick Capture Mode
-- Adds support for photo evidence captured during field research

-- ============================================================================
-- ADD PHOTO EVIDENCE SUPPORT
-- ============================================================================

-- Add image_url column for photo evidence
ALTER TABLE public.evidence
ADD COLUMN IF NOT EXISTS image_url TEXT NULL;

-- Add source_type to distinguish URL vs photo evidence
-- Default 'url' for backwards compatibility with existing evidence
ALTER TABLE public.evidence
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'url';

-- Make url nullable (photo evidence uses image_url instead)
ALTER TABLE public.evidence
ALTER COLUMN url DROP NOT NULL;

-- Make question_id nullable (unattached captures during field research)
-- These can be attached to questions later through a "Review captures" flow
ALTER TABLE public.evidence
ALTER COLUMN question_id DROP NOT NULL;

-- Add check constraint: must have either url OR image_url based on source_type
ALTER TABLE public.evidence
ADD CONSTRAINT evidence_url_or_image_check
CHECK (
  (source_type = 'url' AND url IS NOT NULL) OR
  (source_type = 'photo' AND image_url IS NOT NULL)
);

-- Add check constraint: source_type must be valid
ALTER TABLE public.evidence
ADD CONSTRAINT evidence_source_type_check
CHECK (source_type IN ('url', 'photo'));

-- ============================================================================
-- RLS POLICIES FOR UNATTACHED EVIDENCE
-- ============================================================================
-- With nullable question_id, we need to ensure Maho can still access her captures
-- The existing RLS policies already handle this via created_by, but let's verify

-- Note: Existing policies should work because:
-- 1. evidence_insert_maho_only checks created_by = user_id (not question_id)
-- 2. evidence_select_all allows any authenticated user to read evidence
-- 3. evidence_update_maho_only checks created_by = user_id

-- ============================================================================
-- STORAGE BUCKET (run in Supabase dashboard or via API)
-- ============================================================================
-- Note: Storage bucket creation is not done via SQL migration.
-- Create bucket "quick-captures" in Supabase dashboard with:
-- - Public: true (for image URLs to work)
-- - File size limit: 10MB
-- - Allowed MIME types: image/*
-- - RLS: authenticated users can upload to their own folder ({user_id}/*)
