-- Clé / Serrure : note "Codes Statiques" quand la serrure est connectée.

alter table property_details add column if not exists lock_static_codes_notes text;
