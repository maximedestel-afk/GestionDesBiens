-- Bail : durée initiale et durée de tacite reconduction (balises déjà
-- présentes dans le modèle de bail : [initialterm_agreement],
-- [termrenew_agreement]).

alter table property_owner add column if not exists lease_initial_term text;
alter table property_owner add column if not exists lease_renewal_term text;
