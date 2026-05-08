-- CLIENTR database schema
-- Run in Supabase SQL editor (idempotent — safe to re-run)

-- Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  searches_used int not null default 0,
  searches_reset_at timestamptz not null default now(),
  leads_count int not null default 0,
  saved_icp text,
  weekly_digest_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Add new columns if upgrading from an earlier schema OR if profiles already
-- existed (e.g. shared Supabase project with another app).
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists searches_used int not null default 0;
alter table public.profiles add column if not exists searches_reset_at timestamptz not null default now();
alter table public.profiles add column if not exists leads_count int not null default 0;
alter table public.profiles add column if not exists saved_icp text;
alter table public.profiles add column if not exists weekly_digest_enabled boolean not null default false;
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro'));

-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  industry text,
  location text,
  website text,
  instagram text,
  contact_name text,
  contact_email text,
  status text not null default 'new'
    check (status in ('new', 'outreach_sent', 'followed_up', 'replied', 'won', 'lost')),
  outreach_copy text,
  follow_up_copy text,
  notes text,
  fit_reason text,
  fit_score int check (fit_score is null or (fit_score >= 1 and fit_score <= 10)),
  follower_range text,
  website_platform text,
  red_flags text,
  icp_query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add new columns if upgrading from earlier schema
alter table public.leads
  add column if not exists fit_score int check (fit_score is null or (fit_score >= 1 and fit_score <= 10));
alter table public.leads
  add column if not exists follower_range text;
alter table public.leads
  add column if not exists website_platform text;
alter table public.leads
  add column if not exists red_flags text;
alter table public.leads
  add column if not exists why_now text;

create index if not exists leads_user_id_idx on public.leads (user_id, created_at desc);
create index if not exists leads_status_idx on public.leads (user_id, status);
create index if not exists leads_fit_score_idx on public.leads (user_id, fit_score desc);

-- Notes table (separate, append-only timeline)
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

-- Updated_at trigger for leads
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
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

-- Maintain leads_count denormalisation
create or replace function public.bump_leads_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set leads_count = leads_count + 1 where id = new.user_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles set leads_count = greatest(leads_count - 1, 0) where id = old.user_id;
  end if;
  return null;
end;
$$;

drop trigger if exists leads_bump_count on public.leads;
create trigger leads_bump_count
  after insert or delete on public.leads
  for each row execute function public.bump_leads_count();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;

-- RLS policies
drop policy if exists "Users own their profile" on public.profiles;
create policy "Users own their profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users own their leads" on public.leads;
create policy "Users own their leads"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users own their notes" on public.lead_notes;
create policy "Users own their notes"
  on public.lead_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypasses RLS by default; webhook handler uses service role.
