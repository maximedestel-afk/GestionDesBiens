-- Nouveau rôle "operations" : mêmes droits qu'admin, sauf suppression
-- (réservée aux équipements sans aucune donnée renseignée, voir lib/inventaire/actions.ts).
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'operations', 'menage'));
