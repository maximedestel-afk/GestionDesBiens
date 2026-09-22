-- Accréditations par rôle : lecture seule / lecture + écriture / lecture +
-- écriture + suppression — s'applique à tout ce que le rôle peut déjà voir
-- (onglets/menu autorisés). Défaut "write" : comportement inchangé pour les
-- rôles déjà en écriture aujourd'hui (operations/manager/ménage) — sauf
-- prestataire, dont le défaut "read" préserve son accès lecture seule déjà
-- en place avant cette table.

alter table role_permissions
  add column permission_level text not null default 'write'
  check (permission_level in ('read', 'write', 'delete'));

update role_permissions set permission_level = 'read' where role = 'prestataire';
insert into role_permissions (role, permission_level)
  values ('prestataire', 'read')
  on conflict (role) do nothing;
