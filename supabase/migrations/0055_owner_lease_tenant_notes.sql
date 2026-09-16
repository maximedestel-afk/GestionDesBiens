-- Bail : notes libres sur le locataire (ex. précisions juridiques sur la
-- société locataire — immatriculation, restrictions statutaires, etc.).

alter table property_owner add column if not exists lease_tenant_notes text;
