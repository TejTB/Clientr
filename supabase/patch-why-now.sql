-- Adds the why_now column to leads. Idempotent. Run once in Supabase SQL editor.
alter table public.leads add column if not exists why_now text;
