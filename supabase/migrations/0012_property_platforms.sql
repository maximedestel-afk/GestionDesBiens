-- Nouvel onglet Plateformes : Airbnb / Booking.com / Vrbo (standards) + autres
-- plateformes, chacune avec une référence, un lien vers l'annonce et une note.

create table property_platforms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  platform_type text not null check (platform_type in ('airbnb', 'booking', 'vrbo', 'autre')),
  platform_type_detail text,
  listing_name text,
  reference text,
  url text,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_platforms_property_id_idx on property_platforms (property_id, position);

create trigger property_platforms_set_updated_at
  before update on property_platforms
  for each row execute function set_updated_at();

alter table property_platforms enable row level security;

create policy "property_platforms_all_authenticated" on property_platforms
  for all to authenticated using (true) with check (true);
