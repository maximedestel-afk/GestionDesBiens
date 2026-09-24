import { createAdminClient } from "@/lib/supabase/admin";
import { apiErrorResponse, requireApiKey } from "@/lib/api/auth";
import {
  serializeAgencement,
  serializeCleaningProvider,
  serializeEquipment,
  serializeInventoryCategory,
  serializeInventoryItem,
  serializeProperty,
  serializePropertyDetails,
  serializePropertyFinanceSettings,
  serializePropertyKey,
  serializePropertyOwner,
  serializePropertyPlatform,
  serializeRoom,
  serializeRoomBed,
  serializeTask,
  serializeTaskComment,
  serializeWaterElec,
} from "@/lib/inventaire/serialize";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

async function loadPropertyDetail(supabase: SupabaseAdminClient, propertyId: string) {
  const { data: propertyRow, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();
  if (propertyError) throw propertyError;
  if (!propertyRow) return null;

  const [
    { data: owner },
    { data: details },
    { data: agencement },
    { data: waterElec },
    { data: financeSettings },
    { data: keys },
    { data: platforms },
    { data: rooms },
    { data: beds },
    { data: equipment },
    { data: inventoryItems },
    { data: inventoryCategories },
    { data: taskRows },
    { data: propertyData },
  ] = await Promise.all([
    supabase.from("property_owner").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_details").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_agencement").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_water_elec").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_finance_settings").select("*").eq("property_id", propertyId).maybeSingle(),
    supabase.from("property_keys").select("*").eq("property_id", propertyId).order("position"),
    supabase.from("property_platforms").select("*").eq("property_id", propertyId).order("position"),
    supabase.from("rooms").select("*").eq("property_id", propertyId).order("position"),
    supabase.from("room_beds").select("*").eq("property_id", propertyId).order("position"),
    supabase.from("equipment").select("*").eq("property_id", propertyId).order("position"),
    supabase
      .from("inventory_items_view")
      .select("*")
      .eq("property_id", propertyId)
      .order("category")
      .order("position"),
    supabase.from("inventory_categories").select("*").eq("property_id", propertyId).order("position"),
    supabase.from("tasks").select("*").eq("property_id", propertyId).order("created_at", { ascending: false }),
    supabase.from("property_data").select("*").eq("property_id", propertyId).maybeSingle(),
  ]);

  // Éléments de l'onglet "UT - Eau / Élec" (robinet d'arrêt eau, tableau
  // électrique, ballon d'eau chaude…) — mêmes lignes que WaterElecTab
  // (property_elements, section "water_elec"), sans les photos/pièces
  // jointes (hors périmètre de cette API en lecture seule).
  const { data: waterElecElements } = await supabase
    .from("property_elements")
    .select("name, notes")
    .eq("property_id", propertyId)
    .eq("section", "water_elec")
    .order("position");
  const waterElecItems = (waterElecElements ?? []).map((el) => ({ name: el.name, notes: el.notes }));

  const taskIds = (taskRows ?? []).map((r) => r.id);
  const { data: commentRows } =
    taskIds.length > 0
      ? await supabase.from("task_comments").select("*").in("task_id", taskIds).order("created_at", { ascending: true })
      : { data: [] };
  const commentsByTask = new Map<string, ReturnType<typeof serializeTaskComment>[]>();
  for (const row of commentRows ?? []) {
    const comment = serializeTaskComment(row);
    const list = commentsByTask.get(comment.taskId) ?? [];
    list.push(comment);
    commentsByTask.set(comment.taskId, list);
  }

  let cleaningProvider = null;
  if (propertyData?.cleaning_provider_id) {
    const { data: providerRow } = await supabase
      .from("cleaning_providers")
      .select("*")
      .eq("id", propertyData.cleaning_provider_id)
      .maybeSingle();
    cleaningProvider = providerRow ? serializeCleaningProvider(providerRow) : null;
  }

  return {
    ...serializeProperty(propertyRow),
    owner: owner ? serializePropertyOwner(owner) : null,
    details: details ? serializePropertyDetails(details) : null,
    agencement: agencement ? serializeAgencement(agencement) : null,
    waterElec:
      waterElec || waterElecItems.length > 0
        ? {
            ...(waterElec
              ? serializeWaterElec(waterElec)
              : {
                  propertyId,
                  hotWaterProduction: null,
                  hasGas: null,
                  heatingProduction: null,
                  heatingProductionNotes: null,
                }),
            items: waterElecItems,
          }
        : null,
    financeSettings: financeSettings ? serializePropertyFinanceSettings(financeSettings) : null,
    keys: (keys ?? []).map(serializePropertyKey),
    platforms: (platforms ?? []).map(serializePropertyPlatform),
    rooms: (rooms ?? []).map(serializeRoom),
    beds: (beds ?? []).map(serializeRoomBed),
    equipment: (equipment ?? []).map(serializeEquipment),
    inventoryItems: (inventoryItems ?? []).map(serializeInventoryItem),
    inventoryCategories: (inventoryCategories ?? []).map(serializeInventoryCategory),
    tasks: (taskRows ?? []).map((row) => serializeTask(row, commentsByTask.get(row.id) ?? [])),
    cleaningProvider,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiKey(request);
    const { id } = await params;
    const supabase = createAdminClient();
    const detail = await loadPropertyDetail(supabase, id);
    if (!detail) return Response.json({ error: "Bien introuvable." }, { status: 404 });
    return Response.json({ data: detail });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

