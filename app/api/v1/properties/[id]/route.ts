import { createAdminClient } from "@/lib/supabase/admin";
import { apiErrorResponse, requireApiKey } from "@/lib/api/auth";
import {
  serializeAgencement,
  serializeAttachment,
  serializeCleaningProvider,
  serializeEquipment,
  serializeInventoryCategory,
  serializeInventoryItem,
  serializeProperty,
  serializePropertyData,
  serializePropertyDetails,
  serializePropertyElement,
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

// Durée de validité des URL signées des photos/documents renvoyées par
// cette API : plus longue que celle utilisée côté interface (1h, pensée
// pour une session de consultation) car un appelant externe peut vouloir
// synchroniser/traiter les fichiers en différé plutôt que les afficher
// immédiatement.
const API_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24h

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

  // Tous les éléments "à tiroir" d'un bien (property_elements) — une ligne
  // par section (UT - Eau/Élec, DEF - Défauts, AN - Annonce/photos,
  // AU - Autres/notes, CL - éléments clés, DOC - Documents,
  // OW - Documents propriétaire), chacune pouvant avoir des pièces jointes
  // (voir `attachments` ci-dessous, entityType "property_element").
  const { data: elementRows } = await supabase
    .from("property_elements")
    .select("*")
    .eq("property_id", propertyId)
    .order("section")
    .order("position");
  const elements = (elementRows ?? []).map(serializePropertyElement);
  const waterElecItems = elements
    .filter((el) => el.section === "water_elec")
    .map((el) => ({ name: el.name, notes: el.notes }));

  // Toutes les pièces jointes du bien (photos, documents…), tous types
  // d'entité confondus (bien, équipement, élément, clé, article
  // d'inventaire, tâche) — avec URL signée temporaire vers le fichier.
  const { data: attachmentRows } = await supabase
    .from("attachments")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });
  const attachmentList = attachmentRows ?? [];
  let attachments: ReturnType<typeof serializeAttachment>[] = [];
  if (attachmentList.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("property-files")
      .createSignedUrls(
        attachmentList.map((row) => row.file_path),
        API_SIGNED_URL_TTL_SECONDS
      );
    attachments = attachmentList.map((row, i) => serializeAttachment(row, signedUrls?.[i]?.signedUrl ?? null));
  }

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
    propertyData: propertyData ? serializePropertyData(propertyData) : null,
    elements,
    attachments,
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

