-- Bail : coordonnées du locataire (société, directeur).

alter table property_owner add column if not exists lease_tenant_company text;
alter table property_owner add column if not exists lease_tenant_director text;
