-- Bail : date de début.

alter table property_owner add column if not exists lease_start_date text;
