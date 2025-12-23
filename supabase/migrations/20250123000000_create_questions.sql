-- Migration: Create questions table with RLS
-- Epic 2, Story 2.1: Questions Database Schema & Repository

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================

-- Create questions table for strategic questions
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (category in ('market', 'product', 'distribution')),
  recommendation text,
  recommendation_rationale text,
  status text not null default 'draft' check (status in ('draft', 'ready_for_kel', 'approved', 'exploring_alternatives', 'archived')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  viewed_by_kel_at timestamptz
);

-- Add comments for documentation
comment on table public.questions is 'Strategic questions for Maho to research and Kel to decide on.';
comment on column public.questions.category is 'Question category: market, product, or distribution';
comment on column public.questions.status is 'Question workflow status: draft → ready_for_kel → approved/exploring_alternatives';
comment on column public.questions.viewed_by_kel_at is 'Timestamp when Kel first viewed this question';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on status for filtering (most common filter)
create index if not exists questions_status_idx on public.questions (status);

-- Index on category for filtering
create index if not exists questions_category_idx on public.questions (category);

-- Index on created_by for user's questions
create index if not exists questions_created_by_idx on public.questions (created_by);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Reuse existing handle_updated_at function from profiles migration
-- (function already exists, just apply trigger to questions table)

drop trigger if exists on_questions_updated on public.questions;
create trigger on_questions_updated
  before update on public.questions
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
alter table public.questions enable row level security;

-- SELECT policy: Only Maho and Kel can view questions (whitelist by email)
create policy "Authorized users can view questions"
  on public.questions for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- INSERT policy: Only authenticated users with maho/kel profile can create
create policy "Authorized users can create questions"
  on public.questions for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
    and created_by = (select auth.uid())
  );

-- UPDATE policy: Only Maho and Kel can update questions
create policy "Authorized users can update questions"
  on public.questions for update
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

-- DELETE policy: Only Maho and Kel can delete questions
-- Note: Prefer archive over delete in application code
create policy "Authorized users can delete questions"
  on public.questions for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );
