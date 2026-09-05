-- Onglet "Propriétaire" : coordonnées du propriétaire du bien.

create table property_owner (
  property_id uuid primary key references properties (id) on delete cascade,
  last_name text,
  first_name text,
  email text,
  phone text,
  address text,
  notes text,
  updated_at timestamptz not null default now()
);

create trigger property_owner_set_updated_at
  before update on property_owner
  for each row execute function set_updated_at();

alter table property_owner enable row level security;

create policy "property_owner_all_authenticated" on property_owner
  for all to authenticated using (true) with check (true);
