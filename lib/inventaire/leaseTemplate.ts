import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { numberToFrenchWords } from "./leaseNumberToWords";
import type { Property, PropertyAgencement, PropertyDetails, PropertyOwner, PropertyWaterElec } from "./types";

const TEMPLATE_PATH = path.join(process.cwd(), "lib/inventaire/assets/bail-template.docx");

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const RUN_RE = /<w:r>(?:<w:rPr>([\s\S]*?)<\/w:rPr>)?<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t><\/w:r>/g;

/** Word (et Google Docs) coupe souvent une balise tapée d'un bloc, ex.
 * "[nom_bailleur]", en plusieurs `<w:r>` internes de même mise en forme —
 * invisible à l'oeil dans le document, mais invisible aussi à une simple
 * recherche de "[nom_bailleur]" dans le XML brut (le correcteur
 * orthographique/grammatical ou des signets insérés automatiquement en
 * sont la cause la plus fréquente). On supprime ces marqueurs muets puis on
 * fusionne les `<w:r>` consécutifs de même mise en forme avant de chercher
 * les balises, pour que "tapé normalement dans Word" suffise à ce qu'une
 * balise soit reconnue. */
function normalizeRuns(xml: string): string {
  const out = xml
    .replace(/<w:proofErr[^>]*\/>/g, "")
    .replace(/<w:bookmarkStart[^>]*\/>/g, "")
    .replace(/<w:bookmarkEnd[^>]*\/>/g, "");

  let result = "";
  let lastIndex = 0;
  let pending: { rPr: string; attrs: string; text: string } | null = null;

  function flush() {
    if (!pending) return;
    result += `<w:r>${pending.rPr ? `<w:rPr>${pending.rPr}</w:rPr>` : ""}<w:t${pending.attrs}>${pending.text}</w:t></w:r>`;
    pending = null;
  }

  RUN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RUN_RE.exec(out))) {
    const [full, rPr = "", attrs = "", text] = match;
    const gapText = out.slice(lastIndex, match.index);
    // Un blanc pur entre deux `<w:r>` (retour à la ligne d'un export, etc.)
    // n'a aucun effet visuel dans Word : on l'ignore plutôt que de le
    // laisser casser la fusion de deux runs qui, sinon, se suivraient.
    if (gapText.trim().length > 0) {
      flush();
      result += gapText;
    }
    if (pending && pending.rPr === rPr) {
      pending.text += text;
      if (attrs.includes("xml:space") && !pending.attrs.includes("xml:space")) {
        pending.attrs = attrs;
      }
    } else {
      flush();
      pending = { rPr, attrs, text };
    }
    lastIndex = match.index + full.length;
  }
  flush();
  result += out.slice(lastIndex);
  return result;
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
    autrelabel_agreement: owner?.otherAmountLabel ?? "",
    autremontant_agreement: owner?.otherAmount != null ? String(owner.otherAmount) : "",
  };
}

/** Balises de paragraphe(s) conditionnel(s) : `[si_XXX]…texte…[fin_si_XXX]`
 * n'apparaît dans le document généré que si la condition XXX est vraie
 * (sinon tout le bloc, balises comprises, est retiré) — pour les cas où
 * deux passages s'excluent (ex. bailleur individuel vs société) plutôt que
 * de tout montrer en même temps. */
export const LEASE_CONDITIONS = ["bailleur_individuel", "bailleur_société"] as const;
export type LeaseConditionKey = (typeof LEASE_CONDITIONS)[number];

function applyConditionalBlocks(xml: string, conditions: Record<LeaseConditionKey, boolean>): string {
  let out = xml;
  for (const key of LEASE_CONDITIONS) {
    const startTag = `[si_${key}]`;
    const endTag = `[fin_si_${key}]`;
    const include = conditions[key];
    let searchFrom = 0;
    for (;;) {
      const start = out.indexOf(startTag, searchFrom);
      if (start === -1) break;
      const end = out.indexOf(endTag, start + startTag.length);
      // Balise de fin manquante : on laisse tel quel, un admin corrigera dans Word.
      if (end === -1) break;
      const endPos = end + endTag.length;
      out = include
        ? out.slice(0, start) + out.slice(start + startTag.length, end) + out.slice(endPos)
        : out.slice(0, start) + out.slice(endPos);
      searchFrom = start;
    }
  }
  return out;
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

  let xml = normalizeRuns(documentXmlFile.asText());
  const isCompany = input.owner?.isCompany === true;
  xml = applyConditionalBlocks(xml, { bailleur_individuel: !isCompany, bailleur_société: isCompany });
  const fields = buildFieldMap(input);
  for (const [key, value] of Object.entries(fields)) {
    xml = xml.split(`[${key}]`).join(escapeXml(value));
  }

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

const EMPTY_FIELD_MAP_INPUT: Parameters<typeof buildFieldMap>[0] = {
  property: { id: "", reference: "", name: null, address: null, tags: [], createdAt: "", updatedAt: "" },
  owner: null,
  details: null,
  agencement: null,
  waterElec: null,
};

/** Balises que le système sait remplir automatiquement (voir buildFieldMap) — dérivé directement de buildFieldMap pour ne jamais désynchroniser cette liste. */
export function listSupportedLeaseTags(): string[] {
  return Object.keys(buildFieldMap(EMPTY_FIELD_MAP_INPUT));
}

/** Pour la page "Bail type" : quelles balises du système sont effectivement
 * détectables dans ce modèle (après normalisation des runs Word), pour que
 * l'admin voie tout de suite ce qui sera rempli — et ce qui ne le sera pas,
 * ex. une balise scindée par Word en plusieurs morceaux invisibles. */
export function analyzeLeaseTemplateTags(templateBuffer: Buffer): { found: string[]; missing: string[] } {
  const zip = new PizZip(templateBuffer);
  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) throw new Error("Modèle de bail invalide : word/document.xml introuvable.");

  const xml = normalizeRuns(documentXmlFile.asText());
  const found: string[] = [];
  const missing: string[] = [];
  for (const tag of listSupportedLeaseTags()) {
    (xml.includes(`[${tag}]`) ? found : missing).push(tag);
  }
  return { found, missing };
}
