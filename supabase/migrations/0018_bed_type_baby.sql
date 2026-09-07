-- Ajoute "Lit bébé" comme type de lit (Pièces & couchages).

alter table room_beds drop constraint if exists room_beds_bed_type_check;
alter table room_beds add constraint room_beds_bed_type_check check (
  bed_type in ('double', 'queen', 'king', 'sofa_bed', 'lit_bebe', 'autre')
);
