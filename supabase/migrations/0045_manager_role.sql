-- Nouveau rôle "manager" : mêmes droits que "operations", plus la
-- possibilité de supprimer des photos/documents (pièces jointes).

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'operations', 'manager', 'menage', 'prestataire'));
