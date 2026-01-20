-- Epic 16.1: Opportunities table for AI-identified market insights
-- Dependencies: profiles table, handle_updated_at() function

-- ============================================================================
-- OPPORTUNITIES TABLE
-- ============================================================================

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (category in (
    'market_gap',
    'product_opportunity',
    'competitive_weakness',
    'trend_alignment'
  )),
  confidence_score numeric not null check (confidence_score >= 0 and confidence_score <= 1),
  supporting_evidence jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in (
    'new',
    'reviewing',
    'actionable',
    'dismissed'
  )),
  generated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Prevent empty titles
alter table public.opportunities
add constraint opportunities_title_not_empty check (trim(title) <> '');

-- Add comments for documentation
comment on table public.opportunities is 'AI-identified market opportunities derived from knowledge base analysis. Part of Kel Intelligence Platform.';
comment on column public.opportunities.title is 'Clear title describing the opportunity';
comment on column public.opportunities.description is 'Detailed description with rationale';
comment on column public.opportunities.category is 'Opportunity type: market_gap, product_opportunity, competitive_weakness, trend_alignment';
comment on column public.opportunities.confidence_score is 'AI confidence score 0-1 based on evidence strength';
comment on column public.opportunities.supporting_evidence is 'JSONB array: [{entity_type, entity_id, relevance_score, excerpt}]';
comment on column public.opportunities.status is 'Workflow status: new, reviewing, actionable, dismissed';
comment on column public.opportunities.generated_at is 'When AI generated this opportunity';
comment on column public.opportunities.reviewed_at is 'When Maho reviewed (null if not reviewed)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary filtering indexes
create index opportunities_status_idx on public.opportunities (status);
create index opportunities_category_idx on public.opportunities (category);

-- Sort index for dashboard (confidence desc)
create index opportunities_confidence_idx on public.opportunities (confidence_score desc);

-- Composite index for common query pattern (new opportunities by confidence)
create index opportunities_status_confidence_idx
  on public.opportunities (status, confidence_score desc);

-- GIN index for JSONB evidence queries
create index opportunities_evidence_idx
  on public.opportunities using gin (supporting_evidence);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Reuse existing handle_updated_at function from profiles migration
drop trigger if exists on_opportunities_updated on public.opportunities;
create trigger on_opportunities_updated
  before update on public.opportunities
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.opportunities enable row level security;

-- Select policy: Maho and Kel can view all opportunities
create policy "Authorized users can view opportunities"
  on public.opportunities for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- Insert policy: Maho and Kel can create opportunities
-- (primarily used by AI generation job running as authenticated user)
create policy "Authorized users can create opportunities"
  on public.opportunities for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- Update policy: Maho and Kel can update opportunities (status, reviewed_at)
create policy "Authorized users can update opportunities"
  on public.opportunities for update
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

-- Delete policy: Maho and Kel can delete opportunities
create policy "Authorized users can delete opportunities"
  on public.opportunities for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );
