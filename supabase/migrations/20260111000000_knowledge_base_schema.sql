-- Migration: Create Knowledge Base schema for market intelligence entities
-- Epic 14, Story 14.1: Database Schema for Knowledge Entities
--
-- Dependencies:
--   - Requires public.profiles table (20250101000000_create_profiles_table.sql)
--   - Requires public.handle_updated_at() function (20250101000000_create_profiles_table.sql)
--
-- Tables created:
--   - companies: Company profiles (local majors, multinationals, importers, niche)
--   - products: Product data with company relationships
--   - consumers: Consumer segment profiles with demographics
--   - trends: Market trend tracking
--   - research_docs: General research documents
--   - entity_connections: Polymorphic relationship table for entity linking

-- ============================================================================
-- PGVECTOR EXTENSION (AC #3)
-- ============================================================================

-- Enable pgvector extension for future embedding support (Epic 15: AI Chat)
-- Install in public schema for direct column type usage
-- Note: We are NOT adding embedding columns in this story - just enabling the extension
create extension if not exists vector;

-- ============================================================================
-- COMPANIES TABLE (AC #1)
-- ============================================================================

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('local_major', 'multinational', 'importer', 'niche')),
  market_share numeric,
  revenue_estimate text,
  strengths text[],
  weaknesses text[],
  products text[],
  distribution_reach text,
  source_file text,
  raw_content text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Unique constraint on name (case-insensitive)
create unique index companies_name_unique_idx on public.companies (lower(name));

-- Prevent empty names
alter table public.companies
add constraint companies_name_not_empty check (trim(name) <> '');

-- Add comments for documentation
comment on table public.companies is 'Company profiles for Philippine snack market research. Includes local majors, multinationals, importers, and niche players.';
comment on column public.companies.category is 'Company type: local_major, multinational, importer, or niche';
comment on column public.companies.market_share is 'Estimated market share as decimal (e.g., 0.25 for 25%)';
comment on column public.companies.strengths is 'Array of company strengths';
comment on column public.companies.weaknesses is 'Array of company weaknesses';
comment on column public.companies.products is 'Array of notable product names';
comment on column public.companies.distribution_reach is 'Description of distribution network coverage';
comment on column public.companies.source_file is 'Original markdown file path for debugging/updates';
comment on column public.companies.raw_content is 'Original markdown content for full-text search';

-- ============================================================================
-- PRODUCTS TABLE (AC #1)
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id uuid references public.companies(id) on delete set null,
  category text check (category in ('puffed', 'chips', 'nuts', 'crackers', 'corn', 'other')),
  price_point numeric,
  price_tier text check (price_tier in ('value', 'mainstream', 'premium')),
  flavor_profile text[],
  market_position text,
  source_file text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.products is 'Product data for Philippine snack market. Linked to companies, includes pricing and flavor profiles.';
comment on column public.products.company_id is 'Optional FK to companies table - nullable if company not yet linked';
comment on column public.products.category is 'Product category: puffed, chips, nuts, crackers, corn, or other';
comment on column public.products.price_point is 'Actual price in PHP';
comment on column public.products.price_tier is 'Price tier: value, mainstream, or premium';
comment on column public.products.flavor_profile is 'Array of flavor descriptors';
comment on column public.products.market_position is 'Description of market positioning';

-- ============================================================================
-- CONSUMERS TABLE (AC #1)
-- ============================================================================

create table if not exists public.consumers (
  id uuid primary key default gen_random_uuid(),
  segment_name text not null,
  demographics jsonb,
  behaviors text[],
  preferences text[],
  pain_points text[],
  source_file text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.consumers is 'Consumer segment profiles for Philippine snack market. Stores demographics as flexible JSONB.';
comment on column public.consumers.segment_name is 'Segment name, e.g., "Students", "Young Professionals", "Parents"';
comment on column public.consumers.demographics is 'JSONB for flexible demographics (age_range, income, location, etc.)';
comment on column public.consumers.behaviors is 'Array of behavioral patterns';
comment on column public.consumers.preferences is 'Array of preferences';
comment on column public.consumers.pain_points is 'Array of pain points and frustrations';

-- ============================================================================
-- TRENDS TABLE (AC #1)
-- ============================================================================

create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('flavor', 'health', 'packaging', 'channel', 'technology')),
  status text check (status in ('emerging', 'growing', 'mature', 'declining')),
  growth_rate text,
  description text,
  source_file text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.trends is 'Market trend tracking for Philippine snack industry. Categorized by type and lifecycle status.';
comment on column public.trends.category is 'Trend category: flavor, health, packaging, channel, or technology';
comment on column public.trends.status is 'Trend lifecycle: emerging, growing, mature, or declining';
comment on column public.trends.growth_rate is 'Growth rate description or percentage';
comment on column public.trends.description is 'Full trend description for search';

-- ============================================================================
-- RESEARCH_DOCS TABLE (AC #1)
-- ============================================================================

create table if not exists public.research_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  content text,
  summary text,
  source_file text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.research_docs is 'General research documents not fitting other entity types. Stores full markdown content.';
comment on column public.research_docs.category is 'Category matching folder structure (consumers, distribution, regulatory, etc.)';
comment on column public.research_docs.content is 'Full markdown content';
comment on column public.research_docs.summary is 'AI-generated or manual summary for quick display';

-- ============================================================================
-- ENTITY_CONNECTIONS TABLE (AC #1)
-- ============================================================================

create table if not exists public.entity_connections (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('company', 'product', 'consumer', 'trend', 'research')),
  source_id uuid not null,
  target_type text not null check (target_type in ('company', 'product', 'consumer', 'trend', 'research')),
  target_id uuid not null,
  relationship text check (relationship in ('produces', 'competes_with', 'targets', 'related_to', 'mentions')),
  strength numeric check (strength >= 0 and strength <= 1),
  created_at timestamptz default now() not null
);

-- Add comments for documentation
comment on table public.entity_connections is 'Polymorphic relationship table linking any knowledge entities. Enables graph-like queries.';
comment on column public.entity_connections.source_type is 'Source entity type: company, product, consumer, trend, or research';
comment on column public.entity_connections.source_id is 'UUID of source entity (no FK - polymorphic)';
comment on column public.entity_connections.target_type is 'Target entity type: company, product, consumer, trend, or research';
comment on column public.entity_connections.target_id is 'UUID of target entity (no FK - polymorphic)';
comment on column public.entity_connections.relationship is 'Relationship type: produces, competes_with, targets, related_to, or mentions';
comment on column public.entity_connections.strength is 'Connection strength 0-1 for weighted queries';

-- ============================================================================
-- INDEXES (AC #4)
-- ============================================================================

-- Name indexes for all entity tables
create index if not exists companies_name_idx on public.companies (name);
create index if not exists products_name_idx on public.products (name);
create index if not exists consumers_segment_name_idx on public.consumers (segment_name);
create index if not exists trends_name_idx on public.trends (name);
create index if not exists research_docs_title_idx on public.research_docs (title);

-- Category indexes for filtering
create index if not exists companies_category_idx on public.companies (category);
create index if not exists products_category_idx on public.products (category);
create index if not exists trends_category_idx on public.trends (category);
create index if not exists research_docs_category_idx on public.research_docs (category);

-- Full-text search indexes on content fields
create index companies_content_fts_idx
  on public.companies
  using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(raw_content, '')));

create index trends_content_fts_idx
  on public.trends
  using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

create index research_docs_content_fts_idx
  on public.research_docs
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Products company FK index
create index if not exists products_company_id_idx on public.products (company_id);

-- Entity connections indexes
create index entity_connections_source_idx
  on public.entity_connections (source_type, source_id);
create index entity_connections_target_idx
  on public.entity_connections (target_type, target_id);
create index entity_connections_relationship_idx
  on public.entity_connections (relationship);

-- Prevent duplicate connections
create unique index entity_connections_unique_idx
  on public.entity_connections (source_type, source_id, target_type, target_id, relationship);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS (AC #1)
-- ============================================================================

-- Reuse existing handle_updated_at function from profiles migration

drop trigger if exists on_companies_updated on public.companies;
create trigger on_companies_updated
  before update on public.companies
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_products_updated on public.products;
create trigger on_products_updated
  before update on public.products
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_consumers_updated on public.consumers;
create trigger on_consumers_updated
  before update on public.consumers
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_trends_updated on public.trends;
create trigger on_trends_updated
  before update on public.trends
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_research_docs_updated on public.research_docs;
create trigger on_research_docs_updated
  before update on public.research_docs
  for each row execute procedure public.handle_updated_at();

-- Note: entity_connections has no updated_at (connections are created, not updated)

-- ============================================================================
-- ROW LEVEL SECURITY (AC #2)
-- ============================================================================

-- Enable RLS on all tables
alter table public.companies enable row level security;
alter table public.products enable row level security;
alter table public.consumers enable row level security;
alter table public.trends enable row level security;
alter table public.research_docs enable row level security;
alter table public.entity_connections enable row level security;

-- ============================================================================
-- COMPANIES RLS POLICIES
-- ============================================================================

create policy "Authorized users can view companies"
  on public.companies for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can create companies"
  on public.companies for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can update companies"
  on public.companies for update
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

create policy "Authorized users can delete companies"
  on public.companies for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- ============================================================================
-- PRODUCTS RLS POLICIES
-- ============================================================================

create policy "Authorized users can view products"
  on public.products for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can create products"
  on public.products for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can update products"
  on public.products for update
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

create policy "Authorized users can delete products"
  on public.products for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- ============================================================================
-- CONSUMERS RLS POLICIES
-- ============================================================================

create policy "Authorized users can view consumers"
  on public.consumers for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can create consumers"
  on public.consumers for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can update consumers"
  on public.consumers for update
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

create policy "Authorized users can delete consumers"
  on public.consumers for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- ============================================================================
-- TRENDS RLS POLICIES
-- ============================================================================

create policy "Authorized users can view trends"
  on public.trends for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can create trends"
  on public.trends for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can update trends"
  on public.trends for update
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

create policy "Authorized users can delete trends"
  on public.trends for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- ============================================================================
-- RESEARCH_DOCS RLS POLICIES
-- ============================================================================

create policy "Authorized users can view research_docs"
  on public.research_docs for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can create research_docs"
  on public.research_docs for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can update research_docs"
  on public.research_docs for update
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

create policy "Authorized users can delete research_docs"
  on public.research_docs for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- ============================================================================
-- ENTITY_CONNECTIONS RLS POLICIES
-- ============================================================================

create policy "Authorized users can view entity_connections"
  on public.entity_connections for select
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can create entity_connections"
  on public.entity_connections for insert
  to authenticated
  with check (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

create policy "Authorized users can update entity_connections"
  on public.entity_connections for update
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

create policy "Authorized users can delete entity_connections"
  on public.entity_connections for delete
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );
