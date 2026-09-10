-- Mémorise les éléments standards supprimés volontairement (équipement par
-- pièce, éléments Eau/Élec) pour que le chargement automatique des standards
-- ne les fasse pas réapparaître à la prochaine ouverture de l'onglet.
create table standard_item_removals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  room_id uuid references rooms (id) on delete cascade,
  scope text not null check (scope in ('equipment', 'water_elec')),
  name text not null,
  created_at timestamptz not null default now()
);

create index standard_item_removals_lookup_idx
  on standard_item_removals (property_id, scope, room_id);

alter table standard_item_removals enable row level security;

create policy "standard_item_removals_all_authenticated" on standard_item_removals
  for all to authenticated using (true) with check (true);
