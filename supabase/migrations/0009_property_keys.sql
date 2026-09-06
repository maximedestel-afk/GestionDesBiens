-- Détails appartement > Clés (Clé 1, Clé 2…) : type de clé, emplacement,
-- code boîte à clé / adresse et code locker.

create table property_keys (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  key_type text check (key_type in ('guest', 'menage', 'backup', 'autre')),
  key_type_detail text,
  location text check (location in ('boite_a_cle', 'locker', 'autre')),
  location_detail text,
  box_code text,
  locker_address text,
  locker_code text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_keys_property_id_idx on property_keys (property_id, position);

create trigger property_keys_set_updated_at
  before update on property_keys
  for each row execute function set_updated_at();

alter table property_keys enable row level security;

create policy "property_keys_all_authenticated" on property_keys
  for all to authenticated using (true) with check (true);
