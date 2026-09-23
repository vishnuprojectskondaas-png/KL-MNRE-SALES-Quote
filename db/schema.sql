-- Supabase Database Schema & Setup for Kondaas QuotePro

-- 1. Create the settings table for singleton system configurations
create table if not exists settings (
  singleton_key text primary key default 'global',
  company jsonb default '{}'::jsonb,
  bank jsonb default '{}'::jsonb,
  pricing jsonb default '[]'::jsonb,
  warranty jsonb default '[]'::jsonb,
  terms jsonb default '[]'::jsonb,
  bom_templates jsonb default '[]'::jsonb,
  product_descriptions jsonb default '[]'::jsonb,
  product_column_widths jsonb default '{}'::jsonb,
  bom_column_widths jsonb default '{}'::jsonb,
  users jsonb default '[]'::jsonb
);

-- 2. Enable Row Level Security (RLS)
alter table settings enable row level security;

-- 3. Access policies
drop policy if exists "Enable all access for all users" on settings;
create policy "Enable all access for all users" on settings for all using (true) with check (true);

-- 4. Create quotations table for customer quotation records
create table if not exists quotations (
  id text primary key,
  customer_name text,
  customer_details jsonb,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 5. Enable Row Level Security on Quotations
alter table quotations enable row level security;
drop policy if exists "Enable all access for all users" on quotations;
create policy "Enable all access for all users" on quotations for all using (true) with check (true);

-- 6. Initialize default settings row if missing
insert into settings (singleton_key, users) 
values ('global', '[{"id": "admin-01", "name": "Administrator", "username": "admin", "password": "admin123", "role": "admin"}]'::jsonb) 
on conflict (singleton_key) do nothing;
