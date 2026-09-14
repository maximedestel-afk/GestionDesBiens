-- Propriétaire : date/lieu de naissance, nationalité, numéro de passeport.

alter table property_owner add column if not exists birth_date text;
alter table property_owner add column if not exists birth_place text;
alter table property_owner add column if not exists nationality text;
alter table property_owner add column if not exists passport_number text;
