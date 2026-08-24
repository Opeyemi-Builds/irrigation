-- ============================================================================
--  AgroSense — Supabase persistence schema
--  Run once: Supabase dashboard → SQL Editor → New query → paste → Run.
--  Safe to re-run (idempotent).
-- ============================================================================


-- 1) FARM PROFILES -----------------------------------------------------------
--  One row per Product ID. Written and read DIRECTLY from the browser with the
--  public (anon) key, so it needs permissive RLS policies. Nothing private is
--  stored here — the Product ID is a public, presentation-facing identifier.
create table if not exists public.farm_profiles (
  product_id   text primary key,
  farm_name    text,
  crop         text,
  crops        text[] default '{}',
  growth_stage text,
  soil_type    text
);

alter table public.farm_profiles enable row level security;

-- Anyone holding the anon key may read/insert/update a profile.
drop policy if exists "farm_profiles read"   on public.farm_profiles;
drop policy if exists "farm_profiles insert" on public.farm_profiles;
drop policy if exists "farm_profiles update" on public.farm_profiles;

create policy "farm_profiles read"   on public.farm_profiles for select using (true);
create policy "farm_profiles insert" on public.farm_profiles for insert with check (true);
create policy "farm_profiles update" on public.farm_profiles for update using (true) with check (true);

-- Seed the demo farm. The demo login (demo@agrosense.app) maps to Product ID
-- 0001, so on any fresh device the demo loads this saved setup. Edit freely.
insert into public.farm_profiles (product_id, farm_name, crop, crops, growth_stage, soil_type)
values ('0001', 'Demo Farm', 'maize', array['maize','tomato'], 'vegetative', 'loamy')
on conflict (product_id) do nothing;


-- 2) SENSOR READINGS ---------------------------------------------------------
--  Telemetry history. Written and read ONLY by the backend using the
--  service_role key, which BYPASSES row-level security. So RLS is enabled with
--  no policies at all — that fully locks the table to the browser (anon) key,
--  while the backend still has full access. Columns match db.insert_reading()
--  exactly (received_at + the 7 sensor fields).
create table if not exists public.sensor_readings (
  id             bigint generated always as identity primary key,
  received_at    timestamptz not null,
  temperature    real,
  humidity       real,
  soil_moisture  real,
  water_level_cm real,
  reservoir_pct  real,
  pump_status    boolean,
  is_charging    boolean
);

create index if not exists sensor_readings_received_at_idx
  on public.sensor_readings (received_at desc);

alter table public.sensor_readings enable row level security;
--  (intentionally no policies — service_role key only)
