-- Planning : une tâche peut désormais être planifiée sur une date et une
-- plage horaire précises (ex. "Installation wifi 19BAU le 01/01 entre 11h
-- et 13h"). Les trois colonnes restent facultatives : une tâche "classique"
-- (sans planification) continue de fonctionner exactement comme avant.

alter table tasks add column scheduled_date date;
alter table tasks add column start_time time;
alter table tasks add column end_time time;

create index if not exists tasks_scheduled_date_idx on tasks (scheduled_date, start_time);
