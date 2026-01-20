-- Migration: Create competitor_data table with RLS
-- Epic 6, Story 6.1: Competitor Data Schema & Repository
--
-- Dependencies:
--   - Requires public.profiles table (20250101000000_create_profiles_table.sql)
--   - Requires public.handle_updated_at() function (20250101000000_create_profiles_table.sql)

-- ============================================================================
-- COMPETITOR_DATA TABLE
-- ============================================================================

-- Create competitor_data table for positioning chart data points
create table if not exists public.competitor_data (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_score numeric not null check (price_score >= 1 and price_score <= 10),
  quality_score numeric not null check (quality_score >= 1 and quality_score <= 10),
  category text,
  notes text,
  is_kel_position boolean default false,
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.competitor_data is 'Competitor and product data points for positioning scatter chart. Tracks price vs quality scores.';
comment on column public.competitor_data.name is 'Competitor or product name';
comment on column public.competitor_data.price_score is 'Price score 1-10 (x-axis on chart)';
comment on column public.competitor_data.quality_score is 'Quality score 1-10 (y-axis on chart)';
comment on column public.competitor_data.category is 'Optional grouping/categorization';
comment on column public.competitor_data.notes is 'Additional notes or observations';
comment on column public.competitor_data.is_kel_position is 'True if this represents Kel''s target positioning';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on category for filtering (if used for grouping in chart)
create index if not exists competitor_data_category_idx on public.competitor_data (category);

-- Index on is_kel_position for quick filtering
create index if not exists competitor_data_is_kel_position_idx on public.competitor_data (is_kel_position);

-- Index on created_by for user's data points
create index if not exists competitor_data_created_by_idx on public.competitor_data (created_by);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Reuse existing handle_updated_at function from profiles migration
-- (function already exists, just apply trigger to competitor_data table)

drop trigger if exists on_competitor_data_updated on public.competitor_data;
create trigger on_competitor_data_updated
  before update on public.competitor_data
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
alter table public.competitor_data enable row level security;

-- SELECT policy: Only Maho and Kel can view competitor data (whitelist by email)
create policy "Authorized users can view competitor data"
  on public.competitor_data for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- INSERT policy: Only authenticated users with maho/kel profile can create
create policy "Authorized users can create competitor data"
  on public.competitor_data for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
    and created_by = (select auth.uid())
  );

-- UPDATE policy: Only Maho and Kel can update competitor data
create policy "Authorized users can update competitor data"
  on public.competitor_data for update
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

-- DELETE policy: Only Maho and Kel can delete competitor data
create policy "Authorized users can delete competitor data"
  on public.competitor_data for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );
