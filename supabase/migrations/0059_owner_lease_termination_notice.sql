-- Bail : délai de résiliation et préavis, locataire et bailleur (balises
-- [Délai résiliation locataire], [Préavis locataire],
-- [Délai résiliation bailleur], [Préavis bailleur]).

alter table property_owner add column if not exists lease_tenant_termination_delay text;
alter table property_owner add column if not exists lease_tenant_notice text;
alter table property_owner add column if not exists lease_owner_termination_delay text;
alter table property_owner add column if not exists lease_owner_notice text;
