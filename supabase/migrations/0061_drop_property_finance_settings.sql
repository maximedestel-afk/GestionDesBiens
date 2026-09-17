-- L'onglet Finances associe maintenant un bien à son listing VRPlatform
-- automatiquement (même référence des deux côtés), plus besoin d'une
-- association manuelle stockée en base.

drop table if exists property_finance_settings;
