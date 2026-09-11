"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STANDARD_INVENTORY_ITEMS,
  STANDARD_WATER_ELEC_ELEMENT_NAMES,
  standardEquipmentNamesForRoom,
} from "./catalog";
import { decodeCsvBuffer, normalizeHeader, parseCsv } from "./csv";
import { getCurrentProfile, getPrestataireAllowedPropertyIds, listProperties } from "./queries";
import { tabCode } from "./tabs";
import type {
  AttachmentEntityType,
  AttachmentKind,
  ElementSection,
  BedType,
  HeatingProduction,
  HotWaterProduction,
  InventoryCategory,
  ItemCondition,
  PlatformType,
  UserRole,
} from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  // Le rôle "prestataire" est en lecture seule : bloqué ici pour toute
  // action d'écriture, quel que soit l'onglet ou le bien concerné.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "prestataire") throw new Error("Accès en lecture seule.");

  return user;
}

async function requireAdmin(supabase: SupabaseServerClient) {
  const user = await requireUser(supabase);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Réservé aux administrateurs.");
  return user;
}

/** Comme requireAdmin, mais laisse passer les rôles Operations et Manager
 * (Manager a les mêmes droits qu'Operations, plus la suppression de pièces
 * jointes — voir requireAdminOrManager). Le contrôle fin — ex. "uniquement
 * si vide" — reste à la charge de l'appelant. */
async function requireAdminOrOperations(supabase: SupabaseServerClient): Promise<UserRole> {
  const user = await requireUser(supabase);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role as UserRole | undefined;
  if (role !== "admin" && role !== "operations" && role !== "manager") {
    throw new Error("Réservé aux administrateurs.");
  }
  return role;
}

/** Réservé à Admin et Manager — ex. suppression de photos/documents. */
async function requireAdminOrManager(supabase: SupabaseServerClient): Promise<UserRole> {
  const user = await requireUser(supabase);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role as UserRole | undefined;
  if (role !== "admin" && role !== "manager") throw new Error("Réservé aux administrateurs.");
  return role;
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

// Pour les formulaires "tout-en-un" (autosave sur plusieurs champs à la
// fois) : ne journalise que les champs dont la valeur a réellement changé,
// avec leur libellé, plutôt qu'un message générique "X mis à jour".
function changedFieldLabels(
  existing: Record<string, unknown> | null,
  patch: Record<string, unknown>,
  labels: Record<string, string>
): string[] {
  const result: string[] = [];
  for (const [columnKey, label] of Object.entries(labels)) {
    if (!(columnKey in patch)) continue;
    const before = existing?.[columnKey] ?? null;
    const after = patch[columnKey] ?? null;
    if (before !== after) result.push(label);
  }
  return result;
}

async function logSectionChanges(
  supabase: SupabaseServerClient,
  params: {
    propertyId: string;
    entityType: string;
    sectionLabel: string;
    existing: Record<string, unknown> | null;
    patch: Record<string, unknown>;
    labels: Record<string, string>;
  }
) {
  const changed = changedFieldLabels(params.existing, params.patch, params.labels);
  if (changed.length === 0) return;
  await logActivity(supabase, {
    propertyId: params.propertyId,
    entityType: params.entityType,
    action: "update",
    summary: `${params.sectionLabel} › ${changed.join(", ")} mis à jour`,
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

/**
 * Met à jour la ligne "détails d'un bien" d'une table 1-1 avec `properties`
 * (property_details, property_owner, property_agencement, property_water_elec).
 * Utilise un vrai UPDATE plutôt qu'un upsert : ces tables sont éditées depuis
 * plusieurs formulaires distincts qui n'envoient chacun qu'un sous-ensemble de
 * colonnes (ex. property_details est modifiée à la fois depuis l'onglet
 * Détails et depuis la section Clé/Serrure de l'onglet Clés) — un upsert avec
 * un payload partiel ne doit normalement toucher que les colonnes fournies,
 * mais un UPDATE explicite l'garantit sans ambiguïté et évite qu'un
 * enregistrement partiel depuis un autre onglet écrase silencieusement une
 * valeur saisie ailleurs (ex. le numéro PRM qui semblait "s'effacer").
 * La ligne existe déjà pour tout bien créé normalement (créée avec `createProperty`) ;
 * si elle manquait malgré tout, on l'insère.
 */
async function updatePropertyDetailRow(
  supabase: SupabaseServerClient,
  table: "property_details" | "property_owner" | "property_agencement" | "property_water_elec",
  propertyId: string,
  patch: Record<string, unknown>,
  /** true si une ligne existe déjà pour ce bien (déterminé par un SELECT
   * préalable, pas en se fiant au nombre de lignes affectées par l'UPDATE :
   * ça enlève toute ambiguïté sur le fait que l'UPDATE ait bien trouvé la ligne. */
  rowExists: boolean
) {
  if (rowExists) {
    const { error } = await supabase.from(table).update(patch).eq("property_id", propertyId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from(table).insert({ property_id: propertyId, ...patch });
  if (!error) return;
  if (error.code !== "23505") throw error;

  // La ligne existait déjà malgré tout (le SELECT préalable ne l'avait pas
  // détectée — ex. condition de course entre deux enregistrements) : on
  // bascule sur UPDATE plutôt que d'échouer, pour ne jamais perdre une
  // saisie à cause de ce cas.
  const { error: updateError } = await supabase.from(table).update(patch).eq("property_id", propertyId);
  if (updateError) throw updateError;
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

/** Barre de recherche de biens dans l'en-tête (toutes les pages). Lecture
 * seule : pas de requireUser (qui bloque le rôle "prestataire"). */
export async function quickSearchProperties(
  term: string
): Promise<{ id: string; reference: string; name: string | null }[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const allowedPropertyIds =
    profile.role === "prestataire" ? await getPrestataireAllowedPropertyIds(profile.id) : null;

  const properties = await listProperties(term, allowedPropertyIds);
  return properties.slice(0, 8).map((p) => ({ id: p.id, reference: p.reference, name: p.name }));
}

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
  await supabase.from("property_water_elec").insert({ property_id: data.id });
  await supabase.from("property_platforms").insert([
    { property_id: data.id, platform_type: "airbnb", listing_name: null, position: 0 },
    { property_id: data.id, platform_type: "booking", listing_name: null, position: 1 },
  ]);
  await loadStandardInventory(data.id);
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
  await requireAdmin(supabase);

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw error;

  revalidatePath("/inventaire");
  redirect("/inventaire");
}

/* ------------------------------------------------------------------ */
/* Import CSV                                                          */
/* ------------------------------------------------------------------ */

// Plusieurs libellés acceptés par colonne : les fichiers fournis par
// l'utilisateur n'utilisent pas toujours exactement les mêmes en-têtes
// (ex. "Ref" au lieu de "Reference").
const IMPORT_CSV_COLUMNS = {
  reference: ["reference", "ref"],
  name: ["nom"],
  address: ["adresse"],
  surface: ["superficie"],
  capacity: ["capacite"],
  airbnb: ["url airbnb", "airbnb"],
  booking: ["url booking", "booking"],
  vrbo: ["url vrbo", "vrbo"],
  hopper: ["url hopper", "hopper"],
  lastName: ["nom owner"],
  firstName: ["prenom owner"],
  phone: ["tel owner", "telephone owner"],
  email: ["email owner"],
} as const;

export interface ImportPropertiesResult {
  created: number;
  updated: number;
  errors: { line: number; reference: string; message: string }[];
}

/** Crée ou met à jour une ligne property_platforms pour un type de
 * plateforme donné, sans jamais écraser une URL existante par du vide.
 * `ensureRow` force la création de la ligne même sans URL (utilisé pour
 * Airbnb/Booking, toujours présentes par défaut — voir createProperty). */
async function upsertPlatformUrl(
  supabase: SupabaseServerClient,
  propertyId: string,
  type: PlatformType,
  url: string | null,
  existing: { id: string; platform_type: string }[],
  ensureRow: boolean,
  nextPositionRef: { value: number }
) {
  const match = existing.find((p) => p.platform_type === type);
  if (match) {
    if (url) {
      const { error } = await supabase.from("property_platforms").update({ url }).eq("id", match.id);
      if (error) throw error;
    }
    return;
  }
  if (!url && !ensureRow) return;
  const { error } = await supabase.from("property_platforms").insert({
    property_id: propertyId,
    platform_type: type,
    listing_name: null,
    url,
    position: nextPositionRef.value++,
  });
  if (error) throw error;
}

/** Import en masse de biens depuis un fichier CSV (colonnes : Reference,
 * Nom, Adresse, Superficie, Capacité, Url AIRBNB, URL BOOKING, URL VRBO,
 * URL Hopper, Nom Owner, Prénom Owner, Tel Owner, Email Owner — ordre libre).
 * Un bien dont la référence existe déjà est mis à jour plutôt que dupliqué.
 * Chaque ligne est traitée indépendamment : une erreur sur une ligne
 * n'interrompt pas l'import des autres. */
export async function importProperties(formData: FormData): Promise<ImportPropertiesResult> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choisissez un fichier CSV.");

  const text = decodeCsvBuffer(await file.arrayBuffer());
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error("Le fichier est vide.");

  const header = rows[0].map(normalizeHeader);
  const idx = Object.fromEntries(
    Object.entries(IMPORT_CSV_COLUMNS).map(([key, aliases]) => [
      key,
      header.findIndex((h) => (aliases as readonly string[]).includes(h)),
    ])
  ) as Record<keyof typeof IMPORT_CSV_COLUMNS, number>;

  if (idx.reference === -1) throw new Error("Colonne « Reference » introuvable dans le fichier.");

  const get = (row: string[], key: keyof typeof IMPORT_CSV_COLUMNS): string | null => {
    const colIndex = idx[key];
    return colIndex >= 0 ? optionalString(row[colIndex] ?? null) : null;
  };

  const result: ImportPropertiesResult = { created: 0, updated: 0, errors: [] };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((cell) => cell.trim() === "")) continue;

    const reference = get(row, "reference");
    if (!reference) {
      result.errors.push({ line: i + 1, reference: "(vide)", message: "Référence manquante — ligne ignorée." });
      continue;
    }

    try {
      const name = get(row, "name");
      const address = get(row, "address");

      const surfaceRaw = get(row, "surface");
      const surface = surfaceRaw ? Number.parseFloat(surfaceRaw.replace(",", ".")) : null;
      if (surface !== null && !Number.isFinite(surface)) throw new Error("Superficie invalide.");

      const capacityRaw = get(row, "capacity");
      const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
      if (capacity !== null && !Number.isInteger(capacity)) throw new Error("Capacité invalide.");

      const { data: existingProperty } = await supabase
        .from("properties")
        .select("id")
        .eq("reference", reference)
        .maybeSingle();

      let propertyId: string;
      const isNew = !existingProperty;

      if (existingProperty) {
        propertyId = existingProperty.id;
        const { error } = await supabase.from("properties").update({ name, address }).eq("id", propertyId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("properties")
          .insert({ reference, name, address })
          .select("id")
          .single();
        if (error) {
          if (error.code === "23505") throw new Error("Cette référence existe déjà.");
          throw error;
        }
        propertyId = created.id;
        await supabase.from("property_details").insert({ property_id: propertyId });
        await supabase.from("property_owner").insert({ property_id: propertyId });
        await supabase.from("property_water_elec").insert({ property_id: propertyId });
      }

      const { data: existingAgencement } = await supabase
        .from("property_agencement")
        .select("property_id")
        .eq("property_id", propertyId)
        .maybeSingle();
      await updatePropertyDetailRow(
        supabase,
        "property_agencement",
        propertyId,
        { surface, capacity },
        !!existingAgencement
      );

      const ownerPatch = {
        last_name: get(row, "lastName"),
        first_name: get(row, "firstName"),
        phone: get(row, "phone"),
        email: get(row, "email"),
      };
      if (Object.values(ownerPatch).some((v) => v !== null)) {
        const { data: existingOwner } = await supabase
          .from("property_owner")
          .select("property_id")
          .eq("property_id", propertyId)
          .maybeSingle();
        await updatePropertyDetailRow(supabase, "property_owner", propertyId, ownerPatch, !!existingOwner);
      }

      const { data: existingPlatforms } = await supabase
        .from("property_platforms")
        .select("id, platform_type")
        .eq("property_id", propertyId);
      const positionRef = { value: existingPlatforms?.length ?? 0 };
      const platforms = existingPlatforms ?? [];
      await upsertPlatformUrl(supabase, propertyId, "airbnb", get(row, "airbnb"), platforms, true, positionRef);
      await upsertPlatformUrl(supabase, propertyId, "booking", get(row, "booking"), platforms, true, positionRef);
      await upsertPlatformUrl(supabase, propertyId, "vrbo", get(row, "vrbo"), platforms, false, positionRef);
      await upsertPlatformUrl(supabase, propertyId, "hopper", get(row, "hopper"), platforms, false, positionRef);

      await loadStandardInventory(propertyId);

      await logActivity(supabase, {
        propertyId,
        entityType: "property",
        entityId: propertyId,
        action: isNew ? "create" : "update",
        summary: isNew ? `Bien « ${reference} » créé (import CSV)` : `Bien « ${reference} » mis à jour (import CSV)`,
      });

      if (isNew) result.created++;
      else result.updated++;
    } catch (err) {
      result.errors.push({
        line: i + 1,
        reference,
        message: err instanceof Error ? err.message : "Erreur inconnue.",
      });
    }
  }

  revalidatePath("/inventaire");
  return result;
}

/* ------------------------------------------------------------------ */
/* Détails appartement                                                 */
/* ------------------------------------------------------------------ */

// Le formulaire "Détails appartement" est scindé en plusieurs <form> (la
// section "Gestion des clés" a ses propres formulaires par clé, imbriqués
// entre deux morceaux du formulaire principal). Chaque morceau n'envoie donc
// que ses propres champs : on ne patch que les champs réellement présents
// dans le FormData pour ne pas écraser les champs gérés par l'autre morceau.
const PROPERTY_DETAILS_STRING_FIELDS: [string, string, string][] = [
  ["floor", "floor", "Étage"],
  ["floorElevatorNotes", "floor_elevator_notes", "Note étage/ascenseur"],
  ["accessVideoUrl", "access_video_url", "Lien vidéo/photos d'accès"],
  ["trashRoomUrl", "trash_room_url", "Local Poubelle (lien)"],
  ["trashRoomNotes", "trash_room_notes", "Local Poubelle (note)"],
  ["accessCodeClient", "access_code_client", "Code & accès — Client"],
  ["accessCodeCleaning", "access_code_cleaning", "Code & accès — Ménage/maintenance"],
  ["accessCodeBackup", "access_code_backup", "Code & accès — Back up"],
  ["wifiNetwork", "wifi_network", "Réseau Wifi"],
  ["wifiCode", "wifi_code", "Code Wifi"],
  ["wifiPtoNumber", "wifi_pto_number", "Numéro PTO"],
  ["wifiPtoNotes", "wifi_pto_notes", "Note prise optique"],
  ["wifiNotes", "wifi_notes", "Notes Wifi"],
  ["edfNotes", "edf_notes", "Notes EDF"],
  ["edfPrm", "edf_prm", "Numéro PRM"],
  ["syndicName", "syndic_name", "Nom du syndic"],
  ["syndicPhone", "syndic_phone", "Téléphone syndic"],
  ["syndicEmail", "syndic_email", "Email syndic"],
  ["syndicNotes", "syndic_notes", "Notes syndic"],
  ["comment", "comment", "Commentaire"],
  ["lockType", "lock_type", "Type de serrure"],
  ["lockStaticCodesNotes", "lock_static_codes_notes", "Codes Statiques"],
  ["keyContentType", "key_content_type", "Contenu du trousseau"],
  ["keyContentDetail", "key_content_detail", "Détail contenu du trousseau"],
  ["keySetNote", "key_set_note", "Note trousseau"],
];

export async function savePropertyDetails(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: existing } = await supabase
    .from("property_details")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  const patch: Record<string, unknown> = { property_id: propertyId };
  const labels: Record<string, string> = {};
  for (const [formKey, columnKey, label] of PROPERTY_DETAILS_STRING_FIELDS) {
    if (formData.has(formKey)) {
      patch[columnKey] = optionalString(formData.get(formKey));
      labels[columnKey] = label;
    }
  }
  if (formData.has("hasElevator")) {
    patch.has_elevator = formData.get("hasElevator") === "true";
    labels.has_elevator = "Ascenseur";
  }

  await updatePropertyDetailRow(supabase, "property_details", propertyId, patch, !!existing);

  await logSectionChanges(supabase, {
    propertyId,
    entityType: "property_details",
    sectionLabel: tabCode("details"),
    existing,
    patch,
    labels,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Propriétaire                                                        */
/* ------------------------------------------------------------------ */

// Le formulaire "Propriétaire" est scindé en plusieurs <form> (le bloc
// "Bail" a été déplacé dans l'onglet Documents, avec son propre
// formulaire) : chaque morceau n'envoie donc que ses propres champs — on ne
// patch que les champs réellement présents dans le FormData pour ne pas
// écraser les champs gérés par l'autre morceau (voir savePropertyDetails,
// même logique).
const PROPERTY_OWNER_STRING_FIELDS: [string, string, string][] = [
  ["lastName", "last_name", "Nom"],
  ["firstName", "first_name", "Prénom"],
  ["email", "email", "Email"],
  ["phone", "phone", "Téléphone"],
  ["address", "address", "Adresse"],
  ["notes", "notes", "Notes"],
  ["leaseNotes", "lease_notes", "Note Bail"],
  ["ribNotes", "rib_notes", "Note RIB"],
  ["rcpNotes", "rcp_notes", "Note RCP"],
  ["rentNotes", "rent_notes", "Note loyer"],
  ["otherAmountLabel", "other_amount_label", "Autre (précisez)"],
];

function optionalAmount(value: FormDataEntryValue | null, label: string): number | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  const amount = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} doit être un nombre positif.`);
  }
  return amount;
}

export async function savePropertyOwner(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data: existing } = await supabase
    .from("property_owner")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  const patch: Record<string, unknown> = { property_id: propertyId };
  const labels: Record<string, string> = {};
  for (const [formKey, columnKey, label] of PROPERTY_OWNER_STRING_FIELDS) {
    if (formData.has(formKey)) {
      patch[columnKey] = optionalString(formData.get(formKey));
      labels[columnKey] = label;
    }
  }
  if (formData.has("rentType")) {
    const rentTypeRaw = optionalString(formData.get("rentType"));
    patch.rent_type = rentTypeRaw === "fixe" || rentTypeRaw === "fixe_variable" ? rentTypeRaw : null;
    labels.rent_type = "Type de loyer";
  }
  if (formData.has("rentAmount")) {
    patch.rent_amount = optionalAmount(formData.get("rentAmount"), "Le loyer");
    labels.rent_amount = "Loyer";
  }
  if (formData.has("chargesAmount")) {
    patch.charges_amount = optionalAmount(formData.get("chargesAmount"), "Les charges");
    labels.charges_amount = "Charges";
  }
  if (formData.has("otherAmount")) {
    patch.other_amount = optionalAmount(formData.get("otherAmount"), "Le montant « Autre »");
    labels.other_amount = "Autre (montant)";
  }

  await updatePropertyDetailRow(supabase, "property_owner", propertyId, patch, !!existing);

  await logSectionChanges(supabase, {
    propertyId,
    entityType: "property_owner",
    sectionLabel: tabCode("proprietaire"),
    existing,
    patch,
    labels,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Agencement                                                          */
/* ------------------------------------------------------------------ */

const PROPERTY_AGENCEMENT_LABELS: Record<string, string> = {
  capacity: "Nombre de personnes maximum",
  surface: "Superficie",
};

export async function saveAgencement(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const capacityRaw = optionalString(formData.get("capacity"));
  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
    throw new Error("La capacité doit être un nombre entier positif.");
  }
  const surfaceRaw = optionalString(formData.get("surface"));
  const surface = surfaceRaw ? Number.parseFloat(surfaceRaw.replace(",", ".")) : null;
  if (surface !== null && (!Number.isFinite(surface) || surface < 0)) {
    throw new Error("La superficie doit être un nombre positif.");
  }

  const { data: existing } = await supabase
    .from("property_agencement")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  const patch = { property_id: propertyId, capacity, surface };
  await updatePropertyDetailRow(supabase, "property_agencement", propertyId, patch, !!existing);

  await logSectionChanges(supabase, {
    propertyId,
    entityType: "property_agencement",
    sectionLabel: tabCode("agencement"),
    existing,
    patch,
    labels: PROPERTY_AGENCEMENT_LABELS,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Eau / Élec                                                           */
/* ------------------------------------------------------------------ */

const PROPERTY_WATER_ELEC_LABELS: Record<string, string> = {
  hot_water_production: "Production eau chaude",
  has_gas: "Gaz",
  heating_production: "Production chauffage",
  heating_production_notes: "Production chauffage › Note",
};

export async function saveWaterElec(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const hotWaterProductionRaw = optionalString(formData.get("hotWaterProduction"));
  const hotWaterProduction =
    hotWaterProductionRaw === "individuelle" || hotWaterProductionRaw === "collective"
      ? (hotWaterProductionRaw as HotWaterProduction)
      : null;
  const hasGas = formData.has("hasGas") ? formData.get("hasGas") === "true" : null;
  const heatingProductionRaw = optionalString(formData.get("heatingProduction"));
  const heatingProduction =
    heatingProductionRaw === "individuelle" || heatingProductionRaw === "collective" || heatingProductionRaw === "autre"
      ? (heatingProductionRaw as HeatingProduction)
      : null;
  const heatingProductionNotes = optionalString(formData.get("heatingProductionNotes"));

  const { data: existing } = await supabase
    .from("property_water_elec")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  const patch = {
    property_id: propertyId,
    hot_water_production: hotWaterProduction,
    has_gas: hasGas,
    heating_production: heatingProduction,
    heating_production_notes: heatingProductionNotes,
  };
  await updatePropertyDetailRow(supabase, "property_water_elec", propertyId, patch, !!existing);

  await logSectionChanges(supabase, {
    propertyId,
    entityType: "property_water_elec",
    sectionLabel: tabCode("eauelec"),
    existing,
    patch,
    labels: PROPERTY_WATER_ELEC_LABELS,
  });

  revalidateProperty(propertyId);
}

export async function loadStandardWaterElecElements(propertyId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: existing } = await supabase
    .from("property_elements")
    .select("name")
    .eq("property_id", propertyId)
    .eq("section", "water_elec");
  const existingNames = new Set((existing ?? []).map((r) => r.name));

  const { data: removed } = await supabase
    .from("standard_item_removals")
    .select("name")
    .eq("property_id", propertyId)
    .is("room_id", null)
    .eq("scope", "water_elec");
  const removedNames = new Set((removed ?? []).map((r) => r.name));

  const toAdd = STANDARD_WATER_ELEC_ELEMENT_NAMES.filter(
    (name) => !existingNames.has(name) && !removedNames.has(name)
  );
  if (toAdd.length === 0) return;

  const { data: maxPos } = await supabase
    .from("property_elements")
    .select("position")
    .eq("property_id", propertyId)
    .eq("section", "water_elec")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let position = (maxPos?.position ?? -1) + 1;
  const rows = toAdd.map((name) => ({
    property_id: propertyId,
    section: "water_elec" as const,
    name,
    position: position++,
  }));

  const { error } = await supabase.from("property_elements").insert(rows);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_element",
    action: "create",
    summary: `Éléments standards Eau/Élec chargés (${rows.length})`,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Éléments (Eau/Élec + Notes)                                          */
/* ------------------------------------------------------------------ */

export async function createPropertyElement(
  propertyId: string,
  section: ElementSection,
  formData: FormData
) {
  const supabase = await createClient();
  await requireUser(supabase);

  const name = requireNonEmpty(formData.get("name"), "Le nom");
  const notes = optionalString(formData.get("notes"));
  const url = optionalString(formData.get("url"));

  const { data: maxPos } = await supabase
    .from("property_elements")
    .select("position")
    .eq("property_id", propertyId)
    .eq("section", section)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("property_elements")
    .insert({
      property_id: propertyId,
      section,
      name,
      notes,
      url,
      position: (maxPos?.position ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_element",
    entityId: data.id,
    action: "create",
    summary: `Élément « ${name} » ajouté`,
  });

  revalidateProperty(propertyId);
}

export async function updatePropertyElement(propertyId: string, elementId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const name = requireNonEmpty(formData.get("name"), "Le nom");
  const notes = optionalString(formData.get("notes"));
  const url = optionalString(formData.get("url"));

  const { error } = await supabase
    .from("property_elements")
    .update({ name, notes, url })
    .eq("id", elementId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_element",
    entityId: elementId,
    action: "update",
    summary: `Élément « ${name} » mis à jour`,
  });

  revalidateProperty(propertyId);
}

export async function ensureDefaultKeyElements(propertyId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { count } = await supabase
    .from("property_elements")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("section", "cles");
  if (count) return;

  const { error } = await supabase.from("property_elements").insert({
    property_id: propertyId,
    section: "cles",
    name: "Carte clé",
    position: 0,
  });
  if (error) throw error;

  revalidateProperty(propertyId);
}

export async function deletePropertyElement(propertyId: string, elementId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data: element } = await supabase
    .from("property_elements")
    .select("name, section")
    .eq("id", elementId)
    .maybeSingle();

  const { error } = await supabase.from("property_elements").delete().eq("id", elementId);
  if (error) throw error;

  // Empêche le chargement automatique des éléments standards Eau/Élec de
  // recréer cet élément à la prochaine ouverture de l'onglet.
  if (element?.section === "water_elec" && element.name) {
    await supabase.from("standard_item_removals").insert({
      property_id: propertyId,
      room_id: null,
      scope: "water_elec",
      name: element.name,
    });
  }

  await logActivity(supabase, {
    propertyId,
    entityType: "property_element",
    entityId: elementId,
    action: "delete",
    summary: `Élément « ${element?.name ?? elementId} » supprimé`,
  });

  revalidateProperty(propertyId);
}

function keyPatchFromForm(formData: FormData) {
  return {
    name: optionalString(formData.get("name")),
    notes: optionalString(formData.get("notes")),
    key_type: optionalString(formData.get("keyType")),
    key_type_detail: optionalString(formData.get("keyTypeDetail")),
    location: optionalString(formData.get("location")),
    location_detail: optionalString(formData.get("locationDetail")),
    box_location: optionalString(formData.get("boxLocation")),
    box_code: optionalString(formData.get("boxCode")),
    locker_address: optionalString(formData.get("lockerAddress")),
    locker_code: optionalString(formData.get("lockerCode")),
  };
}

export async function createPropertyKey(propertyId: string, name: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const trimmedName = requireNonEmpty(name, "Le nom de la clé");

  const { data: maxPos } = await supabase
    .from("property_keys")
    .select("position")
    .eq("property_id", propertyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("property_keys").insert({
    property_id: propertyId,
    name: trimmedName,
    position: (maxPos?.position ?? -1) + 1,
  });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_key",
    action: "create",
    summary: `Clé « ${trimmedName} » ajoutée`,
  });

  revalidateProperty(propertyId);
}

export async function updatePropertyKey(propertyId: string, keyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const patch = keyPatchFromForm(formData);
  const { error } = await supabase.from("property_keys").update(patch).eq("id", keyId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_key",
    entityId: keyId,
    action: "update",
    summary: "Clé mise à jour",
  });

  revalidateProperty(propertyId);
}

export async function deletePropertyKey(propertyId: string, keyId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.from("property_keys").delete().eq("id", keyId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_key",
    entityId: keyId,
    action: "delete",
    summary: "Clé supprimée",
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Plateformes (Airbnb, Booking.com, Vrbo, autres)                    */
/* ------------------------------------------------------------------ */

function platformPatchFromForm(formData: FormData) {
  return {
    platform_type_detail: optionalString(formData.get("platformTypeDetail")),
    listing_name: optionalString(formData.get("listingName")),
    reference: optionalString(formData.get("reference")),
    url: optionalString(formData.get("url")),
    notes: optionalString(formData.get("notes")),
  };
}

export async function createPropertyPlatform(propertyId: string, platformType: PlatformType) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: maxPos } = await supabase
    .from("property_platforms")
    .select("position")
    .eq("property_id", propertyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("property_platforms").insert({
    property_id: propertyId,
    platform_type: platformType,
    listing_name: null,
    position: (maxPos?.position ?? -1) + 1,
  });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_platform",
    action: "create",
    summary: "Plateforme ajoutée",
  });

  revalidateProperty(propertyId);
}

export async function ensureDefaultPlatforms(propertyId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { count } = await supabase
    .from("property_platforms")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  if (count) return;

  const { error } = await supabase.from("property_platforms").insert([
    { property_id: propertyId, platform_type: "airbnb", listing_name: null, position: 0 },
    { property_id: propertyId, platform_type: "booking", listing_name: null, position: 1 },
  ]);
  if (error) throw error;

  revalidateProperty(propertyId);
}

export async function updatePropertyPlatform(propertyId: string, platformId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const patch = platformPatchFromForm(formData);
  const { error } = await supabase.from("property_platforms").update(patch).eq("id", platformId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_platform",
    entityId: platformId,
    action: "update",
    summary: "Plateforme mise à jour",
  });

  revalidateProperty(propertyId);
}

export async function deletePropertyPlatform(propertyId: string, platformId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.from("property_platforms").delete().eq("id", platformId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "property_platform",
    entityId: platformId,
    action: "delete",
    summary: "Plateforme supprimée",
  });

  revalidateProperty(propertyId);
}

export async function createRoom(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const roomType = requireNonEmpty(formData.get("roomType"), "Le type de pièce");
  const baseName =
    roomType === "autre" ? requireNonEmpty(formData.get("customName"), "Le nom de la pièce") : roomType;
  const description = optionalString(formData.get("description"));

  const { data: existingRooms } = await supabase.from("rooms").select("name").eq("property_id", propertyId);
  const existingNames = new Set((existingRooms ?? []).map((r) => r.name));
  let name = baseName;
  if (existingNames.has(name)) {
    let n = 2;
    while (existingNames.has(`${baseName} ${n}`)) n++;
    name = `${baseName} ${n}`;
  }

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
  await requireAdmin(supabase);

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
/* Lits (Pièces & couchages)                                           */
/* ------------------------------------------------------------------ */

export async function createRoomBed(propertyId: string, roomId: string, bedType: BedType) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: maxPos } = await supabase
    .from("room_beds")
    .select("position")
    .eq("room_id", roomId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("room_beds").insert({
    property_id: propertyId,
    room_id: roomId,
    bed_type: bedType,
    position: (maxPos?.position ?? -1) + 1,
  });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "room_bed",
    action: "create",
    summary: "Lit ajouté",
  });

  revalidateProperty(propertyId);
}

export async function updateRoomBed(propertyId: string, bedId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const bedTypeDetail = optionalString(formData.get("bedTypeDetail"));
  const { error } = await supabase.from("room_beds").update({ bed_type_detail: bedTypeDetail }).eq("id", bedId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "room_bed",
    entityId: bedId,
    action: "update",
    summary: "Lit mis à jour",
  });

  revalidateProperty(propertyId);
}

export async function deleteRoomBed(propertyId: string, bedId: string) {
  const supabase = await createClient();
  await requireAdminOrOperations(supabase);

  const { error } = await supabase.from("room_beds").delete().eq("id", bedId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "room_bed",
    entityId: bedId,
    action: "delete",
    summary: "Lit supprimé",
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
    notes: optionalString(formData.get("notes")),
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

export async function deleteEquipment(propertyId: string, equipmentId: string) {
  const supabase = await createClient();
  const role = await requireAdminOrOperations(supabase);

  const { data: item } = await supabase
    .from("equipment")
    .select("name, room_id, brand, model, warranty, serial_number, video_link, notes")
    .eq("id", equipmentId)
    .maybeSingle();

  if (role === "operations" || role === "manager") {
    const { count } = await supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", "equipment")
      .eq("entity_id", equipmentId);
    const isEmpty =
      !item?.brand &&
      !item?.model &&
      !item?.warranty &&
      !item?.serial_number &&
      !item?.video_link &&
      !item?.notes &&
      !count;
    if (!isEmpty) {
      throw new Error("Ce rôle ne peut supprimer que les équipements sans donnée renseignée.");
    }
  }

  const { error } = await supabase.from("equipment").delete().eq("id", equipmentId);
  if (error) throw error;

  // Empêche le chargement automatique des équipements standards de la pièce
  // de recréer cet équipement à la prochaine ouverture de l'onglet.
  if (item?.room_id && item.name) {
    await supabase.from("standard_item_removals").insert({
      property_id: propertyId,
      room_id: item.room_id,
      scope: "equipment",
      name: item.name,
    });
  }

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

  const { data: room } = await supabase.from("rooms").select("name").eq("id", roomId).maybeSingle();
  const standardNames = standardEquipmentNamesForRoom(room?.name ?? "");
  if (standardNames.length === 0) return;

  const { data: existing } = await supabase.from("equipment").select("name").eq("room_id", roomId);
  const existingNames = new Set((existing ?? []).map((r) => r.name));

  const { data: removed } = await supabase
    .from("standard_item_removals")
    .select("name")
    .eq("room_id", roomId)
    .eq("scope", "equipment");
  const removedNames = new Set((removed ?? []).map((r) => r.name));

  const namesToAdd = standardNames.filter((name) => !existingNames.has(name) && !removedNames.has(name));
  if (namesToAdd.length === 0) return;

  const { data: maxPos } = await supabase
    .from("equipment")
    .select("position")
    .eq("room_id", roomId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  let position = (maxPos?.position ?? -1) + 1;
  const rows = namesToAdd.map((name) => ({
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
    summary: `Équipements standards chargés (${rows.length} éléments)`,
  });

  revalidateProperty(propertyId);
}

/* ------------------------------------------------------------------ */
/* Inventaire du foyer                                                 */
/* ------------------------------------------------------------------ */

export async function createInventoryCategory(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  await requireUser(supabase);

  const name = requireNonEmpty(formData.get("name"), "Le nom de la catégorie");

  const { data: maxPos } = await supabase
    .from("inventory_categories")
    .select("position")
    .eq("property_id", propertyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("inventory_categories").insert({
    property_id: propertyId,
    name,
    position: (maxPos?.position ?? -1) + 1,
  });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_category",
    action: "create",
    summary: `Catégorie « ${name} » ajoutée`,
  });

  revalidateProperty(propertyId);
}

export async function deleteInventoryCategory(propertyId: string, categoryId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data: category } = await supabase
    .from("inventory_categories")
    .select("name")
    .eq("id", categoryId)
    .maybeSingle();

  const { error } = await supabase.from("inventory_categories").delete().eq("id", categoryId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "inventory_category",
    entityId: categoryId,
    action: "delete",
    summary: `Catégorie « ${category?.name ?? categoryId} » supprimée`,
  });

  revalidateProperty(propertyId);
}

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
      stock_updated_at: inStock > 0 ? new Date().toISOString() : null,
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
      target: item.isTableware || item.bedMultiplier ? null : item.target,
      is_tableware: item.isTableware,
      bed_multiplier: item.bedMultiplier ?? null,
      position,
      stock_updated_at: null,
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
    .select("is_tableware, bed_multiplier")
    .eq("id", itemId)
    .maybeSingle();
  if (item?.is_tableware || item?.bed_multiplier != null) {
    throw new Error("La cible de cet article est calculée automatiquement.");
  }

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
  await requireAdmin(supabase);

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
  await requireAdminOrManager(supabase);

  const { data: attachment } = await supabase
    .from("attachments")
    .select("file_path, file_name, kind")
    .eq("id", attachmentId)
    .maybeSingle();
  if (!attachment) return;

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
/* Tâches (TA)                                                          */
/* ------------------------------------------------------------------ */

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const propertyId = requireNonEmpty(formData.get("propertyId"), "Le bien");
  const text = requireNonEmpty(formData.get("text"), "La tâche");
  const assignedTo = optionalString(formData.get("assignedTo"));

  const { error } = await supabase.from("tasks").insert({
    property_id: propertyId,
    text,
    created_by: user.id,
    created_by_email: user.email,
    assigned_to: assignedTo,
  });
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "task",
    action: "create",
    summary: "Tâche ajoutée",
  });

  revalidateProperty(propertyId);
  revalidatePath("/inventaire");
}

export async function toggleTaskDone(propertyId: string, taskId: string, done: boolean) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { error } = await supabase
    .from("tasks")
    .update({
      done,
      done_by: done ? user.id : null,
      done_by_email: done ? user.email : null,
      done_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) throw error;

  revalidateProperty(propertyId);
  revalidatePath("/inventaire");
}

export async function addTaskComment(propertyId: string, taskId: string, formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const text = requireNonEmpty(formData.get("text"), "Le message");

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    text,
    created_by: user.id,
    created_by_email: user.email,
  });
  if (error) throw error;

  revalidateProperty(propertyId);
}

export async function deleteTask(propertyId: string, taskId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;

  await logActivity(supabase, {
    propertyId,
    entityType: "task",
    action: "delete",
    summary: "Tâche supprimée",
  });

  revalidateProperty(propertyId);
  revalidatePath("/inventaire");
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

/** Enregistre les biens et onglets autorisés d'un nouvel utilisateur "prestataire". */
async function applyPrestataireAccess(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  formData: FormData
) {
  const propertyIds = formData.getAll("propertyIds").map(String).filter(Boolean);
  const allowedTabs = formData.getAll("allowedTabs").map(String).filter(Boolean);

  await admin.from("profiles").update({ allowed_tabs: allowedTabs }).eq("id", userId);
  if (propertyIds.length > 0) {
    await admin
      .from("profile_properties")
      .insert(propertyIds.map((propertyId) => ({ profile_id: userId, property_id: propertyId })));
  }
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
    if (role === "prestataire") await applyPrestataireAccess(admin, data.user.id, formData);
  }

  revalidatePath("/inventaire/utilisateurs");
}

export async function createUserDirect(formData: FormData) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const email = requireNonEmpty(formData.get("email"), "L'email");
  const password = requireNonEmpty(formData.get("password"), "Le mot de passe");
  const fullName = optionalString(formData.get("fullName"));
  const role = (optionalString(formData.get("role")) ?? "menage") as UserRole;

  if (password.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error) throw new Error(error.message);

  if (data.user) {
    await admin.from("profiles").update({ role, full_name: fullName }).eq("id", data.user.id);
    if (role === "prestataire") await applyPrestataireAccess(admin, data.user.id, formData);
  }

  revalidatePath("/inventaire/utilisateurs");
}

export async function updatePrestataireAccess(userId: string, propertyIds: string[], allowedTabs: string[]) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ allowed_tabs: allowedTabs })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error: deleteError } = await supabase.from("profile_properties").delete().eq("profile_id", userId);
  if (deleteError) throw deleteError;

  if (propertyIds.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_properties")
      .insert(propertyIds.map((propertyId) => ({ profile_id: userId, property_id: propertyId })));
    if (insertError) throw insertError;
  }

  revalidatePath("/inventaire/utilisateurs");
}

export async function updateUserPassword(userId: string, formData: FormData) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const password = requireNonEmpty(formData.get("password"), "Le mot de passe");
  if (password.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);

  revalidatePath("/inventaire/utilisateurs");
}

export async function deleteUserAccount(userId: string) {
  const supabase = await createClient();
  const currentUser = await requireAdmin(supabase);
  if (currentUser.id === userId) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/inventaire/utilisateurs");
}

/* ------------------------------------------------------------------ */
/* Accès (admin) — notes techniques (codes, mots de passe...)          */
/* ------------------------------------------------------------------ */

export async function saveAppNotes(formData: FormData) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const content = optionalString(formData.get("content"));

  const { error } = await supabase.from("app_notes").upsert({ id: "main", content });
  if (error) throw error;

  revalidatePath("/inventaire/acces");
}

/* ------------------------------------------------------------------ */
/* Liste des biens — indicateur "données manquantes"                   */
/* ------------------------------------------------------------------ */

export async function dismissChecklistItem(propertyId: string, checkKey: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase
    .from("property_checklist_dismissals")
    .upsert({ property_id: propertyId, check_key: checkKey });
  if (error) throw error;

  revalidatePath("/inventaire");
  revalidateProperty(propertyId);
}

export async function undismissChecklistItem(propertyId: string, checkKey: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase
    .from("property_checklist_dismissals")
    .delete()
    .eq("property_id", propertyId)
    .eq("check_key", checkKey);
  if (error) throw error;

  revalidatePath("/inventaire");
  revalidateProperty(propertyId);
}
