-- Onglet DATA : "Bonus FD", un pourcentage saisi manuellement (ex. 50 pour
-- "50% en dessous du coût du ménage") — champ propre à MGB, sans lien avec
-- Guesty.

alter table property_data add column bonus_fd_percent numeric;
