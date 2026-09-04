-- Registre des biens — schéma initial
-- Application de gestion d'inventaire pour un parc de locations meublées.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profils utilisateurs (rôles admin / ménage)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'menage')),
  created_at timestamptz not null default now()
);

-- Crée automatiquement un profil (rôle admin par défaut) à la création d'un
-- compte Supabase Auth. Un administrateur peut ensuite ajuster le rôle.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Biens (propriétés)
-- ---------------------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger properties_set_updated_at
  before update on properties
  for each row execute function set_updated_at();

-- Détails "Appartement", "Wifi", "Client", "Électricité", "Syndic" (onglet 1)
create table property_details (
  property_id uuid primary key references properties (id) on delete cascade,
  floor text,
  has_elevator boolean,
  access_code_client text,
  access_code_cleaning text,
  access_code_backup text,
  wifi_network text,
  wifi_code text,
  client_reference text,
  edf_prm text,
  syndic_name text,
  syndic_phone text,
  syndic_email text,
  syndic_notes text,
  updated_at timestamptz not null default now()
);

create trigger property_details_set_updated_at
  before update on property_details
  for each row execute function set_updated_at();

-- Agencement (onglet 2) : capacité d'accueil, lit bébé
create table property_agencement (
  property_id uuid primary key references properties (id) on delete cascade,
  capacity integer check (capacity is null or capacity >= 0),
  baby_bed boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger property_agencement_set_updated_at
  before update on property_agencement
  for each row execute function set_updated_at();

-- Pièces & couchages (source du menu déroulant "Pièce" pour les équipements)
create table rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_property_id_idx on rooms (property_id, position);

create trigger rooms_set_updated_at
  before update on rooms
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Équipements techniques (onglet 3), classés par pièce
-- ---------------------------------------------------------------------------

create table equipment (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  room_id uuid not null references rooms (id) on delete cascade,
  name text not null,
  brand text,
  warranty text,
  model text,
  serial_number text,
  drying_function boolean not null default false,
  video_link text,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index equipment_property_id_idx on equipment (property_id);
create index equipment_room_id_idx on equipment (room_id, position);

create trigger equipment_set_updated_at
  before update on equipment
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventaire du foyer (onglet 4), classé par catégorie
-- ---------------------------------------------------------------------------

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  category text not null check (
    category in (
      'Cuisine', 'Chambre', 'Salle de bain', 'Salon',
      'Produits d''entretien', 'Sécurité', 'Divers'
    )
  ),
  name text not null,
  in_stock integer not null default 0,
  target integer,
  is_tableware boolean not null default false,
  condition text not null default 'Bon' check (condition in ('Bon', 'Usé', 'À remplacer')),
  notes text,
  position integer not null default 0,
  stock_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_property_id_idx on inventory_items (property_id, category, position);

create trigger inventory_items_set_updated_at
  before update on inventory_items
  for each row execute function set_updated_at();

-- Vue calculant la cible effective (auto = capacité + 2 pour les articles de
-- type "couverts") et l'écart. security_invoker garantit que les policies RLS
-- des tables sous-jacentes s'appliquent toujours à travers la vue.
create view inventory_items_view
  with (security_invoker = true)
as
select
  i.*,
  case
    when i.is_tableware then coalesce(a.capacity, 0) + 2
    else i.target
  end as effective_target,
  i.in_stock - (
    case
      when i.is_tableware then coalesce(a.capacity, 0) + 2
      else coalesce(i.target, 0)
    end
  ) as gap
from inventory_items i
left join property_agencement a on a.property_id = i.property_id;

-- ---------------------------------------------------------------------------
-- Pièces jointes (photos, vidéos, contrats) — stockage Supabase Storage
-- ---------------------------------------------------------------------------

create table attachments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  entity_type text not null check (entity_type in ('property', 'equipment', 'inventory_item')),
  entity_id uuid not null,
  kind text not null check (
    kind in (
      'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
      'visit_video', 'equipment_photo', 'equipment_reference_photo',
      'inventory_item_photo'
    )
  ),
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id)
);

create index attachments_entity_idx on attachments (entity_type, entity_id);
create index attachments_property_id_idx on attachments (property_id);

-- ---------------------------------------------------------------------------
-- Historique des modifications
-- ---------------------------------------------------------------------------

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('create', 'update', 'delete')),
  summary text not null,
  actor_id uuid references profiles (id),
  actor_email text,
  created_at timestamptz not null default now()
);

create index activity_log_property_id_idx on activity_log (property_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — outil interne : tout utilisateur authentifié (équipe)
-- peut lire/écrire les données des biens. La gestion des rôles reste
-- réservée aux profils "admin".
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table properties enable row level security;
alter table property_details enable row level security;
alter table property_agencement enable row level security;
alter table rooms enable row level security;
alter table equipment enable row level security;
alter table inventory_items enable row level security;
alter table attachments enable row level security;
alter table activity_log enable row level security;

create policy "profiles_select_authenticated" on profiles
  for select to authenticated using (true);

create policy "profiles_update_self" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_manage" on profiles
  for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "properties_all_authenticated" on properties
  for all to authenticated using (true) with check (true);

create policy "property_details_all_authenticated" on property_details
  for all to authenticated using (true) with check (true);

create policy "property_agencement_all_authenticated" on property_agencement
  for all to authenticated using (true) with check (true);

create policy "rooms_all_authenticated" on rooms
  for all to authenticated using (true) with check (true);

create policy "equipment_all_authenticated" on equipment
  for all to authenticated using (true) with check (true);

create policy "inventory_items_all_authenticated" on inventory_items
  for all to authenticated using (true) with check (true);

create policy "attachments_all_authenticated" on attachments
  for all to authenticated using (true) with check (true);

create policy "activity_log_select_authenticated" on activity_log
  for select to authenticated using (true);

create policy "activity_log_insert_authenticated" on activity_log
  for insert to authenticated with check (true);
