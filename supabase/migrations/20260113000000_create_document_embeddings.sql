-- Migration: Document Embeddings for RAG
-- Story: 15-1 Document Embeddings Infrastructure
-- Date: 2026-01-13
--
-- This creates the embeddings infrastructure for semantic search.
-- pgvector extension was already enabled in 20260111000000_knowledge_base_schema.sql

-- ============================================================================
-- Document Embeddings Table
-- ============================================================================

create table if not exists public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  -- Use plural table names to match existing schema for easier joins
  document_type text not null check (document_type in (
    'companies', 'products', 'consumers', 'trends', 'research_docs'
  )),
  document_id uuid not null,
  chunk_index integer not null,
  chunk_text text not null,
  token_count integer not null,  -- For analytics and optimization
  embedding vector(1536) not null,  -- OpenAI text-embedding-3-small dimension
  created_at timestamptz default now() not null,

  -- Unique constraint to support upsert operations
  unique (document_type, document_id, chunk_index)
);

-- Add comment for documentation
comment on table public.document_embeddings is 'Vector embeddings for RAG search across knowledge base entities';
comment on column public.document_embeddings.document_type is 'Source table name (companies, products, consumers, trends, research_docs)';
comment on column public.document_embeddings.embedding is 'OpenAI text-embedding-3-small vector (1536 dimensions)';

-- ============================================================================
-- Indexes
-- ============================================================================

-- HNSW index for fast similarity search using inner product
-- Inner product is used because OpenAI embeddings are normalized (cosine = 1 - inner product)
create index if not exists document_embeddings_embedding_idx
  on public.document_embeddings
  using hnsw (embedding vector_ip_ops);

-- B-tree indexes for filtering and lookups
create index if not exists document_embeddings_doc_type_idx
  on public.document_embeddings (document_type);

create index if not exists document_embeddings_doc_lookup_idx
  on public.document_embeddings (document_type, document_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.document_embeddings enable row level security;

-- Match existing MI tables pattern from knowledge_base_schema.sql
create policy "Authorized users can manage embeddings"
  on public.document_embeddings for all
  to authenticated
  using (
    (select auth.email()) in (
      select email from public.profiles where role in ('maho', 'kel')
    )
  );

-- ============================================================================
-- Vector Similarity Search Function
-- ============================================================================

create or replace function match_embeddings(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_type text default null
)
returns table (
  id uuid,
  document_type text,
  document_id uuid,
  chunk_index integer,
  chunk_text text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    de.id,
    de.document_type,
    de.document_id,
    de.chunk_index,
    de.chunk_text,
    -- Inner product gives negative values for cosine similarity with normalized vectors
    -- We use 1 - (negative distance) = 1 + distance to get positive similarity
    (1 - (de.embedding <#> query_embedding))::float as similarity
  from document_embeddings de
  where (1 - (de.embedding <#> query_embedding)) > match_threshold
    and (filter_type is null or de.document_type = filter_type)
  order by de.embedding <#> query_embedding  -- Ascending order (closer = smaller distance)
  limit match_count;
end;
$$;

comment on function match_embeddings is 'Semantic similarity search using vector inner product';
