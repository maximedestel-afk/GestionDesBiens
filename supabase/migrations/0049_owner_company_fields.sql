-- Propriétaire : coordonnées de la société quand le propriétaire est une
-- personne morale (SCI, SARL...) plutôt qu'une personne physique.

alter table property_owner add column if not exists is_company boolean;
alter table property_owner add column if not exists company_name text;
alter table property_owner add column if not exists company_legal_form text;
alter table property_owner add column if not exists company_capital text;
alter table property_owner add column if not exists company_address text;
alter table property_owner add column if not exists company_siren text;
alter table property_owner add column if not exists company_rcs_city text;
alter table property_owner add column if not exists company_represented_by text;
alter table property_owner add column if not exists company_role text;
