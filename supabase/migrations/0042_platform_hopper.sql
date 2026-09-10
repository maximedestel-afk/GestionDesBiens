-- Ajoute "hopper" comme plateforme standard (en plus d'Airbnb, Booking.com,
-- Vrbo et "autre").

alter table property_platforms drop constraint if exists property_platforms_platform_type_check;
alter table property_platforms add constraint property_platforms_platform_type_check
  check (platform_type in ('airbnb', 'booking', 'vrbo', 'hopper', 'autre'));
