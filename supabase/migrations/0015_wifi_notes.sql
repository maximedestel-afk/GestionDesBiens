-- Détails appartement > Wifi et Électricité (EDF) : champ Notes libre.

alter table property_details add column if not exists wifi_notes text;
alter table property_details add column if not exists edf_notes text;
