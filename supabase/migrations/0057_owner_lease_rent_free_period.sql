-- Bail : franchise de loyer (balise [Franchise de loyer]).

alter table property_owner add column if not exists lease_rent_free_period text;
