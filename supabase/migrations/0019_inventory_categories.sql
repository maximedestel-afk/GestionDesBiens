-- Inventaire : permet d'ajouter des catégories personnalisées en plus des
-- catégories standards (Cuisine, Chambre, Salle de bain, Salon, Produits
-- d'entretien, Sécurité, Divers).

alter table inventory_items drop constraint if exists inventory_items_category_check;

create table inventory_categories (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index inventory_categories_property_id_idx on inventory_categories (property_id, position);

alter table inventory_categories enable row level security;

create policy "inventory_categories_all_authenticated" on inventory_categories
  for all to authenticated using (true) with check (true);
