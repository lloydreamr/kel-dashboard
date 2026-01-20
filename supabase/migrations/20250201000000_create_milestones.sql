-- Migration: Create milestones and milestone_notes tables with RLS
-- Epic 5, Story 5.1: Milestones Database Schema & Repository

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create enum for clarity categories (market, product, distribution)
create type clarity_category as enum ('market', 'product', 'distribution');

-- Create enum for milestone status
create type milestone_status as enum ('not_started', 'in_progress', 'complete');

-- ============================================================================
-- MILESTONES TABLE
-- ============================================================================

-- Create milestones table (fixed 3 rows - one per category)
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  category clarity_category unique not null,
  status milestone_status not null default 'not_started',
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.milestones is 'Tracks clarity milestone progress for Market, Product, and Distribution categories. Fixed 3 rows.';
comment on column public.milestones.category is 'Clarity category: market, product, or distribution (unique constraint)';
comment on column public.milestones.status is 'Milestone status: not_started → in_progress → complete';
comment on column public.milestones.completed_at is 'Timestamp when milestone was marked complete';
comment on column public.milestones.completed_by is 'User who marked the milestone complete';

-- ============================================================================
-- MILESTONE_NOTES TABLE
-- ============================================================================

-- Create milestone_notes table
create table if not exists public.milestone_notes (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  content text not null,
  created_by uuid not null default auth.uid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.milestone_notes is 'Notes attached to milestones by Maho and Kel.';
comment on column public.milestone_notes.milestone_id is 'Foreign key to milestones table';
comment on column public.milestone_notes.content is 'Note content (markdown supported)';
comment on column public.milestone_notes.created_by is 'User who created the note';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on milestone_id for query performance
create index if not exists milestone_notes_milestone_id_idx
  on public.milestone_notes (milestone_id);

-- Index on category for milestones (though only 3 rows)
create index if not exists milestones_category_idx
  on public.milestones (category);

-- Index on status for filtering
create index if not exists milestones_status_idx
  on public.milestones (status);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

-- Trigger for milestones table
drop trigger if exists on_milestones_updated on public.milestones;
create trigger on_milestones_updated
  before update on public.milestones
  for each row execute procedure public.handle_updated_at();

-- Trigger for milestone_notes table
drop trigger if exists on_milestone_notes_updated on public.milestone_notes;
create trigger on_milestone_notes_updated
  before update on public.milestone_notes
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY - MILESTONES
-- ============================================================================

-- CRITICAL DEPENDENCY: RLS policies require public.profiles table with 'role' column
-- If profiles table doesn't exist or schema is different, these policies will fail
-- Verify profiles migration has been applied first

-- Enable RLS on milestones
alter table public.milestones enable row level security;

-- SELECT policy: Only Maho and Kel can view milestones
create policy "Authorized users can view milestones"
  on public.milestones for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- UPDATE policy: Only Maho and Kel can update milestones
create policy "Authorized users can update milestones"
  on public.milestones for update
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  )
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- Note: No INSERT/DELETE policies - milestones are seeded and never deleted

-- ============================================================================
-- ROW LEVEL SECURITY - MILESTONE_NOTES
-- ============================================================================

-- Enable RLS on milestone_notes
alter table public.milestone_notes enable row level security;

-- SELECT policy: Only Maho and Kel can view notes
create policy "Authorized users can view milestone notes"
  on public.milestone_notes for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- INSERT policy: Only Maho and Kel can create notes (with own user id)
create policy "Authorized users can create milestone notes"
  on public.milestone_notes for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
    and created_by = (select auth.uid())
  );

-- UPDATE policy: Users can only update their own notes
create policy "Users can update their own milestone notes"
  on public.milestone_notes for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

-- DELETE policy: Users can only delete their own notes
create policy "Users can delete their own milestone notes"
  on public.milestone_notes for delete
  to authenticated
  using (created_by = (select auth.uid()));

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert the 3 fixed milestone rows (one per category)
insert into public.milestones (category, status) values
  ('market', 'not_started'),
  ('product', 'not_started'),
  ('distribution', 'not_started')
on conflict (category) do nothing; -- Idempotent: don't fail if already seeded
