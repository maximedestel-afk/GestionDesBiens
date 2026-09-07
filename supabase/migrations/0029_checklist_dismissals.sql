-- Liste des biens : indicateur "données manquantes" par bien, avec
-- possibilité de marquer un élément comme normalement vide (masqué de
-- l'indicateur pour ce bien).

create table property_checklist_dismissals (
  property_id uuid not null references properties (id) on delete cascade,
  check_key text not null,
  created_at timestamptz not null default now(),
  primary key (property_id, check_key)
);

alter table property_checklist_dismissals enable row level security;

create policy "property_checklist_dismissals_all_authenticated" on property_checklist_dismissals
  for all to authenticated using (true) with check (true);
