-- Nouveau rôle "prestataire" : accès en lecture seule, restreint aux biens
-- et aux onglets choisis par un admin (voir profile_properties et
-- profiles.allowed_tabs). Appliqué au niveau applicatif (comme les autres
-- rôles de ce projet), pas via des policies RLS granulaires par table.

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'operations', 'menage', 'prestataire'));

alter table profiles add column if not exists allowed_tabs text[] not null default '{}';

create table if not exists profile_properties (
  profile_id uuid not null references profiles (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, property_id)
);

alter table profile_properties enable row level security;

create policy "profile_properties_all_authenticated" on profile_properties
  for all to authenticated using (true) with check (true);
