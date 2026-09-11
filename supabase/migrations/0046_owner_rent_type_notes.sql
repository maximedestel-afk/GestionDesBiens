-- Propriétaire : Loyer (type Fixe / Fixe+Variable) + note libre.

alter table property_owner add column if not exists rent_type text;
alter table property_owner drop constraint if exists property_owner_rent_type_check;
alter table property_owner add constraint property_owner_rent_type_check
  check (rent_type is null or rent_type in ('fixe', 'fixe_variable'));
alter table property_owner add column if not exists rent_notes text;
