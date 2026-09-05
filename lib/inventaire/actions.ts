"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STANDARD_EQUIPMENT_NAMES, STANDARD_INVENTORY_ITEMS } from "./catalog";
import type {
  AttachmentEntityType,
  AttachmentKind,
  InventoryCategory,
  ItemCondition,
  UserRole,
} from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");
  return user;
}

async function requireAdmin(supabase: SupabaseServerClient) {
  const user = await requireUser(supabase);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Réservé aux administrateurs.");
  return user;
}

async function logActivity(
  supabase: SupabaseServerClient,
  params: {
    propertyId: string;
    entityType: string;
    entityId?: string | null;
    action: "create" | "update" | "delete";
    summary: string;
  }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("activity_log").insert({
    property_id: params.propertyId,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    action: params.action,
    summary: params.summary,
    actor_id: user?.id ?? null,
    actor_email: user?.email ?? null,
  });
}

function requireNonEmpty(value: FormDataEntryValue | null, label: string): string {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) throw new Error(`${label} est requis.`);
  return str;
}

function optionalString(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str ? str : null;
}

function revalidateProperty(propertyId: string) {
  revalidatePath(`/inventaire/biens/${propertyId}`);
}

/* ------------------------------------------------------------------ */
/* Authentification                                                    */
/* ------------------------------------------------------------------ */

export async function signIn(formData: FormData) {
  const email = requireNonEmpty(formData.get("email"), "L'email");
  const password = requireNonEmpty(formData.get("password"), "Le mot de passe");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Identifiants incorrects.");

  const next = optionalString(formData.get("next")) ?? "/inventaire";
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/inventaire/login");
}

/* ------------------------------------------------------------------ */
/* Biens                                                                */
/* ------------------------------------------------------------------ */

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const reference = requireNonEmpty(formData.get("reference"), "La référence");
  const name = optionalString(formData.get("name"));
  const address = optionalString(formData.get("address"));

  const { data, error } = await supabase
    .from("properties")
    .insert({ reference, name, address })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Cette référence existe déjà.");
    throw error;
  }

  await supabase.from("property_agencement").insert({ property_id: data.id });
  await supabase.from("property_details").insert({ property_id: data.id });
  await supabase.from("property_owner").insert({ property_id: data.id });
  await logActivity(supabase, {
    propertyId: data.id,
    entityType: "property",
    entityId: data.id,
    action: "create",
    summary: `Bien « ${reference} » créé`,
  });

  revalidatePath("/inventaire");
  redirect(`/inventaire/biens/${data.id}`);
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const reference = requireNonEmpty(formData.get("reference"), "La référence");
  const name = optionalString(formData.get("name"));
  const address = optionalString(formData.get("address"));

  const { error } = await supabase
    .from("properties")
    .update({ reference, name, address })
    .eq("id", propertyId);
  if (error) {
    if (error.code === "23505") throw new Error("Cette référence existe déjà.");
    throw error;
  }

  await logActivity(supabase, {
    propertyId,
    entityType: "property",
    entityId: propertyId,
    action: "update",
    summary: `Fiche bien mise à jour (${reference})`,
  });

  revalidatePath("/inventaire");
  revalidateProperty(propertyId);
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw error;

  revalidatePath("/inventaire");
  redirect("/inventaire");
}

/* ------------------------------------------------------------------ */
/* Détails appartement                                                 */
/* ------------------------------------------------------------------ */

export async function savePropertyDetails(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const patch = {
    property_id: propertyId,
    floor: optionalString(formData.get("floor")),
    has_elevator: formData.has("hasElevator") ? formData.get("hasElevator") === "true" : null,
    access_code_client: optionalString(formData.get("accessCodeClient")),
    access_code_cleaning: optionalString(formData.get("accessCodeCleaning")),
    access_code_backup: optionalString(formData.get("accessCodeBackup")),
    wifi_network: optionalString(formData.get("wifiNetwork")),
    wifi_code: optionalString(formData.get("wifiCode")),
    edf_prm: optionalString(formData.get("edfPrm")),
    syndic_name: optionalString(formData.get("syndicName")),
    syndic_phone: optionalString(formData.get("syndicPhone")),
    syndic_email: optionalString(formData.get("syndicEmail")),
    syndic_notes: optionalString(formData.get("syndicNotes")),
  };

  const { error } = await supabase.from("property_details").upsert(patch);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_details",
    action: "update",
    summary: "Détails appartement mis à jour",
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Propriétaire                                                        */
/* ------------------------------------------------------------------ */

export async function savePropertyOwner(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const patch = {
    property_id: propertyId,
    last_name: optionalString(formData.get("lastName")),
    first_name: optionalString(formData.get("firstName")),
    email: optionalString(formData.get("email")),
    phone: optionalString(formData.get("phone")),
    address: optionalString(formData.get("address")),
    notes: optionalString(formData.get("notes")),
  };

  const { error } = await supabase.from("property_owner").upsert(patch);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_owner",
    action: "update",
    summary: "Propriétaire mis à jour",
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Agencement                                                          */
/* ------------------------------------------------------------------ */

export async function saveAgencement(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const capacityRaw = optionalString(formData.get("capacity"));
  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
    throw new Error("La capacité doit être un nombre entier positif.");
  }
  const babyBed = formData.get("babyBed") === "true";

  const { error } = await supabase
    .from("property_agencement")
    .upsert({ property_id: propertyId, capacity, baby_bed: babyBed });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_agencement",
    action: "update",
    summary: "Agencement mis à jour",
  });

  revalidateProperty(propertyId);
}

export async function createRoom(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const name = requireNonEmpty(formData.get("name"), "Le nom de la pièce");
  const description = optionalString(formData.get("description"));

  const { data: maxPos } = await supabase
    .from("rooms")
    .select("position")
    .eq("property_id", propertyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      property_id: propertyId,
      name,
      description,
      position: (maxPos?.position ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "room",
    entityId: data.id,
    action: "create",
    summary: `Pièce « ${name} » ajoutée`,
  });

  revalidateProperty(propertyId);
}

export async function updateRoom(propertyId: string, roomId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const name = requireNonEmpty(formData.get("name"), "Le nom de la pièce");
  const description = optionalString(formData.get("description"));

  const { error } = await supabase.from("rooms").update({ name, description }).eq("id", roomId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "room",
    entityId: roomId,
    action: "update",
    summary: `Pièce « ${name} » mise à jour`,
  });

  revalidateProperty(propertyId);
}

export async function deleteRoom(propertyId: string, roomId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: room } = await supabase.from("rooms").select("name").eq("id", roomId).maybeSingle();

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "room",
    entityId: roomId,
    action: "delete",
    summary: `Pièce « ${room?.name ?? roomId} » supprimée (et ses équipements)`,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Équipements techniques                                              */
/* ------------------------------------------------------------------ */

function equipmentPatchFromForm(formData: FormData) {
  const name = requireNonEmpty(formData.get("name"), "Le nom de l'équipement");
  return {
    name,
    room_id: requireNonEmpty(formData.get("roomId"), "La pièce"),
    brand: optionalString(formData.get("brand")),
    warranty: optionalString(formData.get("warranty")),
    model: optionalString(formData.get("model")),
    serial_number: optionalString(formData.get("serialNumber")),
    drying_function: name.toLowerCase().includes("lave-linge") && formData.get("dryingFunction") === "true",
    video_link: optionalString(formData.get("videoLink")),
  };
}

export async function createEquipment(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const patch = equipmentPatchFromForm(formData);
  const { data: maxPos } = await supabase
    .from("equipment")
    .select("position")
    .eq("room_id", patch.room_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("equipment")
    .insert({ ...patch, property_id: propertyId, position: (maxPos?.position ?? -1) + 1 })
    .select("id")
    .single();
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "equipment",
    entityId: data.id,
    action: "create",
    summary: `Équipement « ${patch.name} » ajouté`,
  });

  revalidateProperty(propertyId);
}

export async function updateEquipment(propertyId: string, equipmentId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const patch = equipmentPatchFromForm(formData);
  const { error } = await supabase.from("equipment").update(patch).eq("id", equipmentId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "equipment",
    entityId: equipmentId,
    action: "update",
    summary: `Équipement « ${patch.name} » mis à jour`,
  });

  revalidateProperty(propertyId);
}

export async function updateEquipmentDetails(propertyId: string, equipmentId: string, details: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase
    .from("equipment")
    .update({ notes: details.trim() ? details.trim() : null })
    .eq("id", equipmentId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "equipment",
    entityId: equipmentId,
    action: "update",
    summary: "Détails de l'équipement mis à jour",
  });

  revalidateProperty(propertyId);
}

export async function deleteEquipment(propertyId: string, equipmentId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: item } = await supabase.from("equipment").select("name").eq("id", equipmentId).maybeSingle();

  const { error } = await supabase.from("equipment").delete().eq("id", equipmentId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "equipment",
    entityId: equipmentId,
    action: "delete",
    summary: `Équipement « ${item?.name ?? equipmentId} » supprimé`,
  });

  revalidateProperty(propertyId);
}

export async function loadStandardEquipment(propertyId: string, roomId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: maxPos } = await supabase
    .from("equipment")
    .select("position")
    .eq("room_id", roomId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let position = (maxPos?.position ?? -1) + 1;
  const rows = STANDARD_EQUIPMENT_NAMES.map((name) => ({
    property_id: propertyId,
    room_id: roomId,
    name,
    position: position++,
  }));

  const { error } = await supabase.from("equipment").insert(rows);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "equipment",
    action: "create",
    summary: `Équipements standards chargés (${STANDARD_EQUIPMENT_NAMES.length} éléments)`,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Inventaire du foyer                                                 */
/* ------------------------------------------------------------------ */

export async function createInventoryItem(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const name = requireNonEmpty(formData.get("name"), "Le nom de l'article");
  const category = requireNonEmpty(formData.get("category"), "La catégorie") as InventoryCategory;
  const inStockRaw = optionalString(formData.get("inStock"));
  const targetRaw = optionalString(formData.get("target"));
  const inStock = inStockRaw ? Number.parseInt(inStockRaw, 10) : 0;
  const target = targetRaw ? Number.parseInt(targetRaw, 10) : null;

  const { data: maxPos } = await supabase
    .from("inventory_items")
    .select("position")
    .eq("property_id", propertyId)
    .eq("category", category)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      property_id: propertyId,
      category,
      name,
      in_stock: inStock,
      target,
      position: (maxPos?.position ?? -1) + 1,
      stock_updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_item",
    entityId: data.id,
    action: "create",
    summary: `Article « ${name} » ajouté (${category})`,
  });

  revalidateProperty(propertyId);
}

export async function loadStandardInventory(propertyId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: existing } = await supabase
    .from("inventory_items")
    .select("category, name")
    .eq("property_id", propertyId);
  const existingKeys = new Set((existing ?? []).map((r) => `${r.category}::${r.name}`));

  const positionByCategory = new Map<string, number>();
  for (const item of existing ?? []) {
    // position will be recomputed per-category below via count of existing rows
    positionByCategory.set(item.category, (positionByCategory.get(item.category) ?? 0) + 1);
  }

  const rows = STANDARD_INVENTORY_ITEMS.filter(
    (item) => !existingKeys.has(`${item.category}::${item.name}`)
  ).map((item) => {
    const position = positionByCategory.get(item.category) ?? 0;
    positionByCategory.set(item.category, position + 1);
    return {
      property_id: propertyId,
      category: item.category,
      name: item.name,
      in_stock: 0,
      target: item.isTableware ? null : item.target,
      is_tableware: item.isTableware,
      position,
      stock_updated_at: new Date().toISOString(),
    };
  });

  if (rows.length === 0) return;

  const { error } = await supabase.from("inventory_items").insert(rows);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_item",
    action: "create",
    summary: `Liste standard chargée (${rows.length} articles ajoutés)`,
  });

  revalidateProperty(propertyId);
}

export async function updateInventoryStock(propertyId: string, itemId: string, inStock: number) {
  const supabase = await createClient();
  await requireUser(supabase);

  if (!Number.isInteger(inStock) || inStock < 0) throw new Error("Quantité invalide.");

  const { error } = await supabase
    .from("inventory_items")
    .update({ in_stock: inStock, stock_updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_item",
    entityId: itemId,
    action: "update",
    summary: `Quantité en stock mise à jour (${inStock})`,
  });

  revalidateProperty(propertyId);
}

export async function updateInventoryTarget(propertyId: string, itemId: string, target: number) {
  const supabase = await createClient();
  await requireUser(supabase);

  if (!Number.isInteger(target) || target < 0) throw new Error("Cible invalide.");

  const { data: item } = await supabase
    .from("inventory_items")
    .select("is_tableware")
    .eq("id", itemId)
    .maybeSingle();
  if (item?.is_tableware) throw new Error("La cible de cet article est calculée automatiquement.");

  const { error } = await supabase.from("inventory_items").update({ target }).eq("id", itemId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_item",
    entityId: itemId,
    action: "update",
    summary: `Cible mise à jour (${target})`,
  });

  revalidateProperty(propertyId);
}

export async function updateInventoryDetails(propertyId: string, itemId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const condition = requireNonEmpty(formData.get("condition"), "L'état") as ItemCondition;
  const notes = optionalString(formData.get("notes"));

  const { error } = await supabase.from("inventory_items").update({ condition, notes }).eq("id", itemId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_item",
    entityId: itemId,
    action: "update",
    summary: "Fiche article mise à jour (état / notes)",
  });

  revalidateProperty(propertyId);
}

export async function deleteInventoryItem(propertyId: string, itemId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: item } = await supabase
    .from("inventory_items")
    .select("name")
    .eq("id", itemId)
    .maybeSingle();

  const { error } = await supabase.from("inventory_items").delete().eq("id", itemId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_item",
    entityId: itemId,
    action: "delete",
    summary: `Article « ${item?.name ?? itemId} » supprimé`,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Pièces jointes                                                       */
/* ------------------------------------------------------------------ */

export async function recordAttachment(input: {
  propertyId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  kind: AttachmentKind;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
}) {
  const supabase = await createClient();
  const user = input.kind === "lease_contract" ? await requireAdmin(supabase) : await requireUser(supabase);

  const { error } = await supabase.from("attachments").insert({
    property_id: input.propertyId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    kind: input.kind,
    file_path: input.filePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    created_by: user.id,
  });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId: input.propertyId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: "create",
    summary: `Fichier « ${input.fileName} » ajouté`,
  });

  revalidateProperty(input.propertyId);
}

export async function deleteAttachment(propertyId: string, attachmentId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: attachment } = await supabase
    .from("attachments")
    .select("file_path, file_name, kind")
    .eq("id", attachmentId)
    .maybeSingle();
  if (!attachment) return;
  if (attachment.kind === "lease_contract") await requireAdmin(supabase);

  await supabase.storage.from("property-files").remove([attachment.file_path]);

  const { error } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "attachment",
    entityId: attachmentId,
    action: "delete",
    summary: `Fichier « ${attachment.file_name} » supprimé`,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Utilisateurs (admin)                                                 */
/* ------------------------------------------------------------------ */

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;

  revalidatePath("/inventaire/utilisateurs");
}

export async function inviteUser(formData: FormData) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const email = requireNonEmpty(formData.get("email"), "L'email");
  const role = (optionalString(formData.get("role")) ?? "menage") as UserRole;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) throw new Error(error.message);

  if (data.user) {
    await admin.from("profiles").update({ role }).eq("id", data.user.id);
  }

  revalidatePath("/inventaire/utilisateurs");
}
