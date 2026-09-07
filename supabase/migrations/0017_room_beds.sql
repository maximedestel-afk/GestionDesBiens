-- Agencement > Pièces & couchages : liste des lits par pièce (Double, Queen,
-- King, Canapé-lit, ou Autre à préciser).

create table room_beds (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  room_id uuid not null references rooms (id) on delete cascade,
  bed_type text not null check (bed_type in ('double', 'queen', 'king', 'sofa_bed', 'autre')),
  bed_type_detail text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index room_beds_room_id_idx on room_beds (room_id, position);
create index room_beds_property_id_idx on room_beds (property_id);

create trigger room_beds_set_updated_at
  before update on room_beds
  for each row execute function set_updated_at();

alter table room_beds enable row level security;

create policy "room_beds_all_authenticated" on room_beds
  for all to authenticated using (true) with check (true);
