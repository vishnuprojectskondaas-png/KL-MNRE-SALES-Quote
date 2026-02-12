
-- IMPORTANT: Run this entire script in the Supabase SQL Editor to fix the "User Data Not Storing" issue.

-- 1. Create the settings table if it doesn't exist
create table if not exists settings (
  singleton_key text primary key default 'global',
  company jsonb,
  bank jsonb,
  pricing jsonb,
  warranty jsonb,
  terms jsonb,
  bom_templates jsonb,
  product_descriptions jsonb,
  users jsonb -- This is the critical column for User Management
);

-- 2. Force Add 'users' column if it is missing (Safe to run multiple times)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'settings' and column_name = 'users') then
    alter table settings add column users jsonb default '[]'::jsonb;
  end if;
end $$;

-- 3. Enable Security
alter table settings enable row level security;

-- 4. Allow All Access (Since we handle auth in the app)
drop policy if exists "Enable all access for all users" on settings;
create policy "Enable all access for all users" on settings for all using (true) with check (true);

-- 5. Create quotations table
create table if not exists quotations (
  id text primary key,
  customer_name text,
  customer_details jsonb,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 6. Enable Security on Quotations
alter table quotations enable row level security;
drop policy if exists "Enable all access for all users" on quotations;
create policy "Enable all access for all users" on quotations for all using (true) with check (true);

-- 7. Initialize the default settings row if missing
insert into settings (singleton_key, users) 
values ('global', '[{"id": "admin-01", "name": "Administrator", "username": "admin", "password": "admin123", "role": "admin"}]'::jsonb) 
on conflict (singleton_key) do nothing;
