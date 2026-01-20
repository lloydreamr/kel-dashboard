-- Migration: Add updated_at timestamp tracking to evidence table
-- Epic 7, Story 7.1: Timestamp Tracking on All Data Points
--
-- Note: evidence table was created directly in Supabase, so this
-- migration adds the missing updated_at column and trigger.

-- ============================================================================
-- ADD UPDATED_AT COLUMN TO EVIDENCE
-- ============================================================================

ALTER TABLE public.evidence
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now() not null;

-- Backfill existing rows: set updated_at = created_at
UPDATE public.evidence
SET updated_at = created_at
WHERE updated_at IS NULL OR updated_at = now();

-- ============================================================================
-- ADD AUTO-UPDATE TRIGGER
-- ============================================================================

-- Reuse existing handle_updated_at function from profiles migration
DROP TRIGGER IF EXISTS on_evidence_updated ON public.evidence;
CREATE TRIGGER on_evidence_updated
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- VERIFY DECISIONS TRIGGER (if missing)
-- ============================================================================

-- Check and add decisions trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_decisions_updated ON public.decisions;
CREATE TRIGGER on_decisions_updated
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
