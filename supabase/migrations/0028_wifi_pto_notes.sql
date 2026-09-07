-- Détails appartement > Wifi : note pour la photo prise optique et
-- branchements (ex. emplacement).

alter table property_details add column if not exists wifi_pto_notes text;
