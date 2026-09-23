-- Nouvel onglet DATA (données diverses du bien) — première donnée :
-- Prestataire Ménage, choisi dans une liste extensible.

create table cleaning_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into cleaning_providers (name) values ('SWEEPIT'), ('SNG TOGOU'), ('FATIHA');

alter table cleaning_providers enable row level security;

create policy "cleaning_providers_all_authenticated" on cleaning_providers
  for all to authenticated using (true) with check (true);

create table property_data (
  property_id uuid primary key references properties (id) on delete cascade,
  cleaning_provider_id uuid references cleaning_providers (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger property_data_set_updated_at
  before update on property_data
  for each row execute function set_updated_at();

alter table property_data enable row level security;

create policy "property_data_all_authenticated" on property_data
  for all to authenticated using (true) with check (true);
