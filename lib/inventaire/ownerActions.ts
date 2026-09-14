"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOwnerSession, clearOwnerSession, getOwnerSessionEmail } from "./ownerAuth";

function optionalString(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str ? str : null;
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]/g, "_")
    .slice(-120);
}

/** Vérifie que la session en cours a le droit d'agir sur ce bien (l'email
 * de session doit correspondre à l'email déjà enregistré sur la fiche
 * Propriétaire) et renvoie cet email. Centralise la vérification faite par
 * chaque action d'écriture self-service. */
async function assertOwnerAccess(
  admin: ReturnType<typeof createAdminClient>,
  propertyId: string
): Promise<string> {
  const sessionEmail = await getOwnerSessionEmail();
  if (!sessionEmail) throw new Error("Votre session a expiré, merci de vous reconnecter.");

  const { data: existingOwner, error } = await admin
    .from("property_owner")
    .select("email")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  if (!existingOwner || (existingOwner.email ?? "").toLowerCase() !== sessionEmail) {
    throw new Error("Accès non autorisé pour ce bien.");
  }
  return sessionEmail;
}

/** Identifie le propriétaire par l'email déjà enregistré sur au moins une
 * fiche bien (pas de compte à créer) et ouvre une session self-service. */
export async function ownerLogin(formData: FormData): Promise<void> {
  const emailRaw = optionalString(formData.get("email"));
  if (!emailRaw) throw new Error("Merci de renseigner votre adresse email.");
  const email = emailRaw.toLowerCase();

  const admin = createAdminClient();
  const { data, error } = await admin.from("property_owner").select("property_id").ilike("email", email);
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Aucun bien trouvé avec cette adresse email. Contactez votre gestionnaire.");
  }

  await createOwnerSession(email);
  redirect("/inventaire/proprietaire");
}

export async function ownerLogout(): Promise<void> {
  await clearOwnerSession();
  redirect("/inventaire/proprietaire");
}

export interface OwnerPropertyOption {
  propertyId: string;
  reference: string;
  name: string | null;
  address: string | null;
}

/** Tous les biens dont la fiche Propriétaire porte cet email (un même
 * propriétaire peut avoir plusieurs biens). */
export async function listOwnerProperties(email: string): Promise<OwnerPropertyOption[]> {
  const admin = createAdminClient();
  const { data: owners, error } = await admin.from("property_owner").select("property_id").ilike("email", email);
  if (error) throw error;

  const propertyIds = (owners ?? []).map((o) => o.property_id as string);
  if (propertyIds.length === 0) return [];

  const { data: properties, error: propertiesError } = await admin
    .from("properties")
    .select("id, reference, name, address")
    .in("id", propertyIds)
    .order("reference", { ascending: true });
  if (propertiesError) throw propertiesError;

  return (properties ?? []).map((p) => ({
    propertyId: p.id,
    reference: p.reference,
    name: p.name,
    address: p.address,
  }));
}

// Champs "coordonnées propriétaire" (identité + société) susceptibles
// d'être communs à tous les biens d'un même propriétaire — PAS les champs
// propres au bien (syndic, superficie, eau/élec...).
const OWNER_SHARED_FIELDS = [
  "last_name",
  "first_name",
  "phone",
  "address",
  "birth_date",
  "birth_place",
  "nationality",
  "passport_number",
  "is_company",
  "company_name",
  "company_legal_form",
  "company_capital",
  "company_address",
  "company_siren",
  "company_rcs_city",
  "company_represented_by",
  "company_role",
] as const;

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

/** Complète les champs vides de `ownerRow` (coordonnées propriétaire +
 * société uniquement) avec les valeurs déjà renseignées sur un autre bien
 * du même propriétaire (identifié par email) — jamais l'inverse : un champ
 * déjà rempli sur ce bien n'est pas écrasé. */
export async function withOwnerFallback(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  propertyId: string,
  ownerRow: Record<string, unknown> | null
): Promise<Record<string, unknown> | null> {
  const merged: Record<string, unknown> = { property_id: propertyId, email, ...ownerRow };
  const missingFields = OWNER_SHARED_FIELDS.filter((f) => isEmptyValue(merged[f]));
  if (missingFields.length === 0) return ownerRow ? merged : ownerRow;

  const { data: otherRows, error } = await admin
    .from("property_owner")
    .select("*")
    .ilike("email", email)
    .neq("property_id", propertyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!otherRows || otherRows.length === 0) return ownerRow;

  for (const field of missingFields) {
    for (const row of otherRows as unknown as Record<string, unknown>[]) {
      if (!isEmptyValue(row[field])) {
        merged[field] = row[field];
        break;
      }
    }
  }

  return merged;
}

/** Enregistre le formulaire self-service propriétaire (identité, société,
 * production eau chaude/chauffage, coordonnées syndic + numéro de lot).
 * N'écrit que si l'email de la session correspond bien à l'email déjà
 * enregistré sur ce bien — empêche un propriétaire de modifier un bien qui
 * n'est pas le sien en changeant juste l'identifiant dans l'URL. */
export async function saveOwnerSelfService(propertyId: string, formData: FormData): Promise<void> {
  const admin = createAdminClient();
  const sessionEmail = await assertOwnerAccess(admin, propertyId);

  const ownerPatch = {
    property_id: propertyId,
    last_name: optionalString(formData.get("lastName")),
    first_name: optionalString(formData.get("firstName")),
    email: optionalString(formData.get("email")) ?? sessionEmail,
    phone: optionalString(formData.get("phone")),
    address: optionalString(formData.get("address")),
    birth_date: optionalString(formData.get("birthDate")),
    birth_place: optionalString(formData.get("birthPlace")),
    nationality: optionalString(formData.get("nationality")),
    passport_number: optionalString(formData.get("passportNumber")),
    is_company: formData.get("isCompany") === "true",
    company_name: optionalString(formData.get("companyName")),
    company_legal_form: optionalString(formData.get("companyLegalForm")),
    company_capital: optionalString(formData.get("companyCapital")),
    company_address: optionalString(formData.get("companyAddress")),
    company_siren: optionalString(formData.get("companySiren")),
    company_rcs_city: optionalString(formData.get("companyRcsCity")),
    company_represented_by: optionalString(formData.get("companyRepresentedBy")),
    company_role: optionalString(formData.get("companyRole")),
  };
  const { error: ownerError } = await admin.from("property_owner").upsert(ownerPatch, { onConflict: "property_id" });
  if (ownerError) throw ownerError;

  const hotWaterRaw = optionalString(formData.get("hotWaterProduction"));
  const heatingRaw = optionalString(formData.get("heatingProduction"));
  const waterElecPatch = {
    property_id: propertyId,
    hot_water_production: hotWaterRaw === "individuelle" || hotWaterRaw === "collective" ? hotWaterRaw : null,
    has_gas: formData.has("hasGas") ? formData.get("hasGas") === "true" : null,
    heating_production:
      heatingRaw === "individuelle" || heatingRaw === "collective" || heatingRaw === "autre" ? heatingRaw : null,
    heating_production_notes: optionalString(formData.get("heatingProductionNotes")),
  };
  const { error: waterElecError } = await admin
    .from("property_water_elec")
    .upsert(waterElecPatch, { onConflict: "property_id" });
  if (waterElecError) throw waterElecError;

  const surfaceRaw = optionalString(formData.get("surface"));
  const surface = surfaceRaw ? Number.parseFloat(surfaceRaw.replace(",", ".")) : null;
  if (surface !== null && !Number.isFinite(surface)) throw new Error("Superficie invalide.");
  const { error: agencementError } = await admin
    .from("property_agencement")
    .upsert({ property_id: propertyId, surface }, { onConflict: "property_id" });
  if (agencementError) throw agencementError;

  const detailsPatch = {
    property_id: propertyId,
    comment: optionalString(formData.get("comment")),
    syndic_name: optionalString(formData.get("syndicName")),
    syndic_phone: optionalString(formData.get("syndicPhone")),
    syndic_email: optionalString(formData.get("syndicEmail")),
    syndic_lot_number: optionalString(formData.get("syndicLotNumber")),
    syndic_notes: optionalString(formData.get("syndicNotes")),
  };
  const { error: detailsError } = await admin
    .from("property_details")
    .upsert(detailsPatch, { onConflict: "property_id" });
  if (detailsError) throw detailsError;

  await admin.from("activity_log").insert({
    property_id: propertyId,
    entity_type: "property_owner",
    action: "update",
    summary: "Informations mises à jour par le propriétaire",
    actor_id: null,
    actor_email: sessionEmail,
  });

  revalidatePath(`/inventaire/proprietaire/${propertyId}`);
}

export interface OwnerRibFile {
  id: string;
  fileName: string;
}

/** RIB déjà envoyés pour ce bien (visible uniquement pour info — pas de
 * suppression côté propriétaire, ça reste au staff). */
export async function listOwnerRibAttachments(propertyId: string): Promise<OwnerRibFile[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attachments")
    .select("id, file_name")
    .eq("property_id", propertyId)
    .eq("entity_type", "property")
    .eq("kind", "rib")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((a) => ({ id: a.id, fileName: a.file_name }));
}

/** Ajoute un RIB (utile quand le propriétaire est une société). Le fichier
 * est envoyé directement via le client à clé de service, le propriétaire
 * n'ayant pas de session Supabase Auth pour uploader lui-même. */
export async function ownerUploadRib(propertyId: string, formData: FormData): Promise<void> {
  const admin = createAdminClient();
  const sessionEmail = await assertOwnerAccess(admin, propertyId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choisissez un fichier.");

  const path = `${propertyId}/property/${propertyId}/rib/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await admin.storage.from("property-files").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) throw new Error(`Échec de l'envoi : ${uploadError.message}`);

  const { error: insertError } = await admin.from("attachments").insert({
    property_id: propertyId,
    entity_type: "property",
    entity_id: propertyId,
    kind: "rib",
    file_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
  });
  if (insertError) throw insertError;

  await admin.from("activity_log").insert({
    property_id: propertyId,
    entity_type: "property",
    entity_id: propertyId,
    action: "create",
    summary: `RIB « ${file.name} » ajouté par le propriétaire`,
    actor_id: null,
    actor_email: sessionEmail,
  });

  revalidatePath(`/inventaire/proprietaire/${propertyId}`);
}
