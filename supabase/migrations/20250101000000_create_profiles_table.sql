-- Migration: Create profiles table with RLS
-- Run this in Supabase SQL Editor or via CLI: supabase db push

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  role text not null check (role in ('maho', 'kel')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add comment for documentation
comment on table public.profiles is 'User profiles linked to auth.users. Role determines feature access.';
comment on column public.profiles.role is 'User role: maho (admin/researcher) or kel (decision maker)';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
alter table public.profiles enable row level security;

-- SELECT policy: users can only read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- UPDATE policy: users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Note: No INSERT or DELETE policies - profiles are created via trigger

-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================================

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    -- Assign role based on email pattern
    -- Default to 'maho' for initial setup
    case
      when new.email like 'kel@%' or new.email like '%+kel@%' then 'kel'
      else 'maho'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call function on new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update timestamp on profile changes
drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on email for lookups (unique via auth.users)
create index if not exists profiles_email_idx on public.profiles (email);

-- Index on role for filtering
create index if not exists profiles_role_idx on public.profiles (role);
