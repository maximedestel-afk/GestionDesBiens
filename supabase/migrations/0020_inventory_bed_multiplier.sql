-- Inventaire : cible automatique pour la literie, basée sur le nombre de
-- couchages du bien (lits, hors lit bébé) plutôt que sur la capacité
-- d'accueil (déjà utilisée pour la vaisselle).

alter table inventory_items add column if not exists bed_multiplier integer;

create or replace view inventory_items_view
  with (security_invoker = true)
as
select
  i.*,
  case
    when i.is_tableware then coalesce(a.capacity, 0) + 2
    when i.bed_multiplier is not null then
      i.bed_multiplier * coalesce(
        (select count(*) from room_beds rb where rb.property_id = i.property_id and rb.bed_type <> 'lit_bebe'),
        0
      )
    else i.target
  end as effective_target,
  i.in_stock - (
    case
      when i.is_tableware then coalesce(a.capacity, 0) + 2
      when i.bed_multiplier is not null then
        i.bed_multiplier * coalesce(
          (select count(*) from room_beds rb where rb.property_id = i.property_id and rb.bed_type <> 'lit_bebe'),
          0
        )
      else coalesce(i.target, 0)
    end
  ) as gap
from inventory_items i
left join property_agencement a on a.property_id = i.property_id;
