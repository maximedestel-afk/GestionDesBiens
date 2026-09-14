"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOwnerSession, clearOwnerSession, getOwnerSessionEmail } from "./ownerAuth";

function optionalString(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str ? str : null;
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
    .select("id, reference, name")
    .in("id", propertyIds)
    .order("reference", { ascending: true });
  if (propertiesError) throw propertiesError;

  return (properties ?? []).map((p) => ({ propertyId: p.id, reference: p.reference, name: p.name }));
}

/** Enregistre le formulaire self-service propriétaire (identité, société,
 * production eau chaude/chauffage, coordonnées syndic + numéro de lot).
 * N'écrit que si l'email de la session correspond bien à l'email déjà
 * enregistré sur ce bien — empêche un propriétaire de modifier un bien qui
 * n'est pas le sien en changeant juste l'identifiant dans l'URL. */
export async function saveOwnerSelfService(propertyId: string, formData: FormData): Promise<void> {
  const sessionEmail = await getOwnerSessionEmail();
  if (!sessionEmail) throw new Error("Votre session a expiré, merci de vous reconnecter.");

  const admin = createAdminClient();
  const { data: existingOwner, error: ownerFetchError } = await admin
    .from("property_owner")
    .select("email")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (ownerFetchError) throw ownerFetchError;
  if (!existingOwner || (existingOwner.email ?? "").toLowerCase() !== sessionEmail) {
    throw new Error("Accès non autorisé pour ce bien.");
  }

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

  const detailsPatch = {
    property_id: propertyId,
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
