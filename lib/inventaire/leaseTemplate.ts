import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { numberToFrenchWords } from "./leaseNumberToWords";
import type { Property, PropertyAgencement, PropertyDetails, PropertyOwner, PropertyWaterElec } from "./types";

const TEMPLATE_PATH = path.join(process.cwd(), "lib/inventaire/assets/bail-template.docx");

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDateFr(isoDate: string | null): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatProduction(value: string | null): string {
  if (value === "individuelle") return "Individuelle";
  if (value === "collective") return "Collective";
  if (value === "autre") return "Autre";
  return "";
}

function formatSyndic(details: PropertyDetails | null): string {
  if (!details) return "";
  const parts = [details.syndicName, details.syndicPhone, details.syndicEmail].filter(Boolean);
  return parts.join(" — ");
}

function formatKeys(details: PropertyDetails | null): string {
  if (!details) return "";
  const typeLabel =
    details.keyContentType === "cle" ? "Clé" : details.keyContentType === "cle_vigik" ? "Clé Vigik" : "";
  return [typeLabel, details.keyContentDetail].filter(Boolean).join(" — ");
}

/** Balises du modèle de bail (voir `assets/bail-template.docx`) déjà
 * remplissables avec les données du système. Les balises absentes de cet
 * objet (ex. [enddate_agreement], [nbrepieces_appart]) ne sont pas suivies
 * dans le système : elles restent visibles telles quelles dans le document
 * généré, à compléter ou retirer manuellement avant signature. */
function buildFieldMap(input: {
  property: Property;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  agencement: PropertyAgencement | null;
  waterElec: PropertyWaterElec | null;
}): Record<string, string> {
  const { property, owner, details, agencement, waterElec } = input;
  const rent = owner?.rentAmount ?? 0;
  const charges = owner?.chargesAmount ?? 0;
  const total = rent + charges;

  return {
    // Bailleur
    nom_bailleur: [owner?.firstName, owner?.lastName].filter(Boolean).join(" "),
    dob_bailleur: formatDateFr(owner?.birthDate ?? null),
    pob_bailleur: owner?.birthPlace ?? "",
    nationality_bailleur: owner?.nationality ?? "",
    passport_bailleur: owner?.passportNumber ?? "",
    address_bailleur: owner?.address ?? "",
    // Société bailleur
    nom_sté: owner?.companyName ?? "",
    forme_sté: owner?.companyLegalForm ?? "",
    capital_sté: owner?.companyCapital ?? "",
    adresse_sté: owner?.companyAddress ?? "",
    siren_sté: owner?.companySiren ?? "",
    rcs_sté: owner?.companyRcsCity ?? "",
    representant_sté: owner?.companyRepresentedBy ?? "",
    qualité_sté: owner?.companyRole ?? "",
    // Locataire
    sté_locataire: owner?.leaseTenantCompany ?? "",
    directeur_locataire: owner?.leaseTenantDirector ?? "",
    notes_locataire: owner?.leaseTenantNotes ?? "",
    // Bien
    address_appart: property.address ?? "",
    superficie_appart: agencement?.surface != null ? String(agencement.surface) : "",
    numerolot_appart: details?.syndicLotNumber ?? "",
    productioneau_appart: formatProduction(waterElec?.hotWaterProduction ?? null),
    productionchauffage_appart: formatProduction(waterElec?.heatingProduction ?? null),
    detailsyndic_appart: formatSyndic(details),
    clés_appart: formatKeys(details),
    // Durée / loyer
    startdate_agreement: formatDateFr(owner?.leaseStartDate ?? null),
    initialterm_agreement: owner?.leaseInitialTerm ?? "",
    termrenew_agreement: owner?.leaseRenewalTerm ?? "",
    loyerchiffre_agreement: rent ? String(rent) : "",
    loyerlettre_agreement: rent ? numberToFrenchWords(rent).toUpperCase() : "",
    chargeschiffre_agreement: charges ? String(charges) : "",
    chargeslettre_agreement: charges ? numberToFrenchWords(charges).toUpperCase() : "",
    totalchiffre_agreement: total ? String(total) : "",
    totallettre_agreement: total ? numberToFrenchWords(total).toUpperCase() : "",
  };
}

/** Remplit le modèle de bail (`assets/bail-template.docx`, balises
 * `[nom_champ]`) avec les données déjà en base pour ce bien. Les balises
 * sans donnée correspondante (locataire filiale, durée, désignation…)
 * restent affichées telles quelles dans le fichier généré — signal clair
 * pour les compléter à la main dans Word avant de reverser la version
 * finale dans la case "Bail". */
export function generateLeaseDocx(input: {
  property: Property;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  agencement: PropertyAgencement | null;
  waterElec: PropertyWaterElec | null;
  /** Modèle personnalisé envoyé par un admin (voir "Bail type" dans le menu) ; à défaut, le modèle par défaut fourni avec l'application. */
  templateBuffer?: Buffer;
}): Buffer {
  const templateBuffer = input.templateBuffer ?? fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);
  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) throw new Error("Modèle de bail invalide : word/document.xml introuvable.");

  let xml = documentXmlFile.asText();
  const fields = buildFieldMap(input);
  for (const [key, value] of Object.entries(fields)) {
    xml = xml.split(`[${key}]`).join(escapeXml(value));
  }

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
