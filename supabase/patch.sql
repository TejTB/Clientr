-- CLIENTR schema patch
-- Run this in Supabase SQL Editor to fix the "Database error saving new user" signup failure.
--
-- Why: this Supabase project has a pre-existing `profiles` table from a different app
-- (columns: full_name, monthly_income, plan_method, weekly_digest, saved_icp). Our
-- `create table if not exists` was a no-op. The `handle_new_user` trigger tries to
-- insert into `(id, email)` but `email` does not exist, so signup 500s.
--
-- This patch adds every CLIENTR column the existing table is missing, without
-- touching the columns from the other app. Safe to re-run.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists searches_used int not null default 0;
alter table public.profiles add column if not exists searches_reset_at timestamptz not null default now();
alter table public.profiles add column if not exists leads_count int not null default 0;
alter table public.profiles add column if not exists weekly_digest_enabled boolean not null default false;

-- Plan check constraint (drop if it already exists with a different shape, then add)
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro'));

-- Re-create the trigger so it definitely points at the current function body
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill email on the existing profile row (the user's pre-existing auth account)
-- so it isn't NULL going forward. Safe no-op if already set.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
