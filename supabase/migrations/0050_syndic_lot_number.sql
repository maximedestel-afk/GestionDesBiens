-- Syndic : numéro de lot.

alter table property_details add column if not exists syndic_lot_number text;
