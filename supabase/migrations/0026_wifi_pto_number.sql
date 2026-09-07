-- Détails appartement > Wifi : ajoute le numéro PTO (prise fibre).

alter table property_details add column if not exists wifi_pto_number text;
