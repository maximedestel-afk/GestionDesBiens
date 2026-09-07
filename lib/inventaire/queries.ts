import { createClient } from "@/lib/supabase/server";
import { computeMissingChecks, type CompletenessCheck } from "./completeness";
import {
  serializeActivityLogEntry,
  serializeAgencement,
  serializeAttachment,
  serializeEquipment,
  serializeInventoryItem,
  serializeProfile,
  serializeProperty,
  serializePropertyDetails,
  serializePropertyElement,
  serializePropertyKey,
  serializePropertyOwner,
  serializeInventoryCategory,
  serializePropertyPlatform,
  serializeRoom,
  serializeRoomBed,
  serializeWaterElec,
} from "./serialize";
import type {
  ActivityLogEntry,
  Attachment,
  AttachmentEntityType,
  ElementSection,
  Equipment,
  InventoryCategoryRow,
  InventoryItem,
  Profile,
  Property,
  PropertyAgencement,
  PropertyDetails,
  PropertyElement,
  PropertyKey,
  PropertyOwner,
  PropertyPlatform,
  PropertyWaterElec,
  Room,
  RoomBed,
} from "./types";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h, largement suffisant pour une session de consultation

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return serializeProfile(data);
}

export async function listProperties(search?: string): Promise<Property[]> {
  const supabase = await createClient();
  let query = supabase.from("properties").select("*").order("reference", { ascending: true });

  const term = search?.trim();
  if (term) {
    const escaped = term.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(`reference.ilike.%${escaped}%,name.ilike.%${escaped}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(serializeProperty);
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? serializeProperty(data) : null;
}

export async function getPropertyDetails(propertyId: string): Promise<PropertyDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_details")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  return data ? serializePropertyDetails(data) : null;
}

export async function getPropertyOwner(propertyId: string): Promise<PropertyOwner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_owner")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  return data ? serializePropertyOwner(data) : null;
}

export async function getPropertyAgencement(propertyId: string): Promise<PropertyAgencement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_agencement")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  return data ? serializeAgencement(data) : null;
}

export async function getPropertyWaterElec(propertyId: string): Promise<PropertyWaterElec | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_water_elec")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  return data ? serializeWaterElec(data) : null;
}

export async function listPropertyElements(
  propertyId: string,
  section: ElementSection
): Promise<PropertyElement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_elements")
    .select("*")
    .eq("property_id", propertyId)
    .eq("section", section)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializePropertyElement);
}

export async function listPropertyKeys(propertyId: string): Promise<PropertyKey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_keys")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializePropertyKey);
}

export async function listPropertyPlatforms(propertyId: string): Promise<PropertyPlatform[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_platforms")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializePropertyPlatform);
}

export async function listRooms(propertyId: string): Promise<Room[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializeRoom);
}

export async function listRoomBeds(propertyId: string): Promise<RoomBed[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_beds")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializeRoomBed);
}

export async function listEquipment(propertyId: string): Promise<Equipment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializeEquipment);
}

export async function listInventoryItems(propertyId: string): Promise<InventoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items_view")
    .select("*")
    .eq("property_id", propertyId)
    .order("category", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializeInventoryItem);
}

export async function listInventoryCategories(propertyId: string): Promise<InventoryCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_categories")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializeInventoryCategory);
}

export async function listAttachments(
  entityType: AttachmentEntityType,
  entityId: string
): Promise<Attachment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("property-files")
        .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS);
      return serializeAttachment(row, signed?.signedUrl ?? null);
    })
  );
  return withUrls;
}

export async function listAttachmentsForProperty(propertyId: string): Promise<Attachment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("property-files")
        .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS);
      return serializeAttachment(row, signed?.signedUrl ?? null);
    })
  );
  return withUrls;
}

export async function listActivityLog(propertyId: string, limit = 100): Promise<ActivityLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(serializeActivityLogEntry);
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("email", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(serializeProfile);
}

export async function getAppNotes(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_notes").select("content").eq("id", "main").maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

export async function listPropertiesMissingChecks(
  propertyIds: string[]
): Promise<Record<string, CompletenessCheck[]>> {
  if (propertyIds.length === 0) return {};
  const supabase = await createClient();

  const [{ data: details }, { data: owners }, { data: agencements }, { data: platforms }, { data: attachments }, { data: dismissals }] =
    await Promise.all([
      supabase.from("property_details").select("property_id, wifi_network, wifi_code").in("property_id", propertyIds),
      supabase.from("property_owner").select("property_id, last_name, email").in("property_id", propertyIds),
      supabase.from("property_agencement").select("property_id, capacity").in("property_id", propertyIds),
      supabase.from("property_platforms").select("property_id, listing_name").in("property_id", propertyIds),
      supabase
        .from("attachments")
        .select("property_id, kind")
        .eq("entity_type", "property")
        .in("kind", ["lease_contract", "rib", "rcp", "key_set_photo", "wifi_contract"])
        .in("property_id", propertyIds),
      supabase.from("property_checklist_dismissals").select("property_id, check_key").in("property_id", propertyIds),
    ]);

  const detailsByProperty = new Map((details ?? []).map((d) => [d.property_id, d]));
  const ownerByProperty = new Map((owners ?? []).map((o) => [o.property_id, o]));
  const agencementByProperty = new Map((agencements ?? []).map((a) => [a.property_id, a]));

  const platformsByProperty = new Map<string, boolean>();
  for (const p of platforms ?? []) {
    if (p.listing_name) platformsByProperty.set(p.property_id, true);
  }

  const attachmentKindsByProperty = new Map<string, Set<string>>();
  for (const a of attachments ?? []) {
    const set = attachmentKindsByProperty.get(a.property_id) ?? new Set<string>();
    set.add(a.kind);
    attachmentKindsByProperty.set(a.property_id, set);
  }

  const dismissedByProperty = new Map<string, Set<string>>();
  for (const d of dismissals ?? []) {
    const set = dismissedByProperty.get(d.property_id) ?? new Set<string>();
    set.add(d.check_key);
    dismissedByProperty.set(d.property_id, set);
  }

  const result: Record<string, CompletenessCheck[]> = {};
  for (const propertyId of propertyIds) {
    const detail = detailsByProperty.get(propertyId);
    const owner = ownerByProperty.get(propertyId);
    const agencement = agencementByProperty.get(propertyId);
    const kinds = attachmentKindsByProperty.get(propertyId) ?? new Set<string>();
    const dismissed = dismissedByProperty.get(propertyId) ?? new Set<string>();

    result[propertyId] = computeMissingChecks(
      {
        ownerLastName: owner?.last_name,
        ownerEmail: owner?.email,
        hasLeaseContract: kinds.has("lease_contract"),
        hasRib: kinds.has("rib"),
        hasRcp: kinds.has("rcp"),
        hasKeySetPhoto: kinds.has("key_set_photo"),
        capacity: agencement?.capacity,
        wifiNetwork: detail?.wifi_network,
        wifiCode: detail?.wifi_code,
        hasWifiContract: kinds.has("wifi_contract"),
        hasPlatformInfo: platformsByProperty.get(propertyId) ?? false,
      },
      dismissed
    );
  }

  return result;
}
