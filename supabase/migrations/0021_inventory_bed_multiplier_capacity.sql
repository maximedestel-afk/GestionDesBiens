-- La cible auto de la literie se base sur la capacité d'accueil (nombre de
-- personnes maximum) plutôt que sur le nombre de lits ajoutés un par un.

drop view if exists inventory_items_view;

create view inventory_items_view
  with (security_invoker = true)
as
select
  i.*,
  case
    when i.is_tableware then coalesce(a.capacity, 0) + 2
    when i.bed_multiplier is not null then i.bed_multiplier * coalesce(a.capacity, 0)
    else i.target
  end as effective_target,
  i.in_stock - (
    case
      when i.is_tableware then coalesce(a.capacity, 0) + 2
      when i.bed_multiplier is not null then i.bed_multiplier * coalesce(a.capacity, 0)
      else coalesce(i.target, 0)
    end
  ) as gap
from inventory_items i
left join property_agencement a on a.property_id = i.property_id;
