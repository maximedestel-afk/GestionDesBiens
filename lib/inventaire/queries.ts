import { createClient } from "@/lib/supabase/server";
import {
  serializeActivityLogEntry,
  serializeAgencement,
  serializeAttachment,
  serializeEquipment,
  serializeInventoryItem,
  serializeProfile,
  serializeProperty,
  serializePropertyDetails,
  serializePropertyOwner,
  serializeRoom,
} from "./serialize";
import type {
  ActivityLogEntry,
  Attachment,
  AttachmentEntityType,
  Equipment,
  InventoryItem,
  Profile,
  Property,
  PropertyAgencement,
  PropertyDetails,
  PropertyOwner,
  Room,
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
