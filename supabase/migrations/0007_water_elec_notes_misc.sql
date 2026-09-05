-- Ajouts : commentaire (Détails appartement), superficie (Agencement),
-- onglet Eau/Élec (production eau chaude, gaz, éléments avec photo/note),
-- onglet Notes (éléments libres avec photo/note).

alter table property_details add column if not exists comment text;
alter table property_agencement add column if not exists surface numeric;

create table property_water_elec (
  property_id uuid primary key references properties (id) on delete cascade,
  hot_water_production text check (hot_water_production in ('individuelle', 'collective')),
  has_gas boolean,
  updated_at timestamptz not null default now()
);

create trigger property_water_elec_set_updated_at
  before update on property_water_elec
  for each row execute function set_updated_at();

alter table property_water_elec enable row level security;

create policy "property_water_elec_all_authenticated" on property_water_elec
  for all to authenticated using (true) with check (true);

-- Éléments génériques (checklist Eau/Élec + onglet Notes), chacun avec une
-- photo/fichier joint (via attachments) et une note libre.
create table property_elements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  section text not null check (section in ('water_elec', 'notes')),
  name text not null,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_elements_property_id_idx on property_elements (property_id, section, position);

create trigger property_elements_set_updated_at
  before update on property_elements
  for each row execute function set_updated_at();

alter table property_elements enable row level security;

create policy "property_elements_all_authenticated" on property_elements
  for all to authenticated using (true) with check (true);

-- Nouveau type d'entité (property_element) et type de pièce jointe
-- (element_photo) pour les pièces jointes des éléments Eau/Élec et Notes.
alter table attachments drop constraint if exists attachments_entity_type_check;
alter table attachments add constraint attachments_entity_type_check check (
  entity_type in ('property', 'equipment', 'inventory_item', 'property_element')
);

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo'
  )
);
