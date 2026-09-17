-- Un bien peut désormais être regroupé avec plusieurs listings VRPlatform
-- supplémentaires (ex. "14ECO 1", "14ECO 2"), pas seulement un seul.

alter table property_finance_settings
  add column extra_vrplatform_references text[] not null default '{}';

update property_finance_settings
  set extra_vrplatform_references = array[extra_vrplatform_reference]
  where extra_vrplatform_reference is not null and extra_vrplatform_reference <> '';

alter table property_finance_settings drop column extra_vrplatform_reference;
