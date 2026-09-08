-- Propriétaire : Loyer (Loyer / Charges / Autre précisé) + Total calculé côté app.

alter table property_owner add column if not exists rent_amount numeric;
alter table property_owner add column if not exists charges_amount numeric;
alter table property_owner add column if not exists other_amount_label text;
alter table property_owner add column if not exists other_amount numeric;
