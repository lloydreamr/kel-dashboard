-- Migration: Fix RLS policies for competitor_data - Kel must be read-only
-- Epic 6, Story 6.3: Data Point Editor - Code Review Fix
--
-- SECURITY FIX: Previous RLS policies allowed Kel to INSERT/UPDATE/DELETE.
-- This migration restricts Kel to SELECT only, while Maho retains full CRUD access.

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

drop policy if exists "Authorized users can create competitor data" on public.competitor_data;
drop policy if exists "Authorized users can update competitor data" on public.competitor_data;
drop policy if exists "Authorized users can delete competitor data" on public.competitor_data;

-- ============================================================================
-- RECREATE POLICIES WITH CORRECT PERMISSIONS
-- ============================================================================

-- INSERT policy: Only Maho can create competitor data
create policy "Only Maho can create competitor data"
  on public.competitor_data for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role = 'maho'
    )
    and created_by = (select auth.uid())
  );

-- UPDATE policy: Only Maho can update competitor data
create policy "Only Maho can update competitor data"
  on public.competitor_data for update
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role = 'maho'
    )
  )
  with check (
    (select auth.email()) in (
      select email from public.profiles where role = 'maho'
    )
  );

-- DELETE policy: Only Maho can delete competitor data
create policy "Only Maho can delete competitor data"
  on public.competitor_data for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role = 'maho'
    )
  );

-- NOTE: SELECT policy remains unchanged - both Maho and Kel can view data
