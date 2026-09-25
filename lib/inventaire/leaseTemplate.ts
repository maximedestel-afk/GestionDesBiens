import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import { numberToFrenchWords } from "./leaseNumberToWords";
import { CSV_FIELDS, type CsvFieldKey } from "./csvFields";
import type { Property, PropertyAgencement, PropertyDetails, PropertyOwner, PropertyWaterElec, Room } from "./types";

const TEMPLATE_PATH = path.join(process.cwd(), "lib/inventaire/assets/bail-template.docx");

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// `<w:r>` porte presque toujours des attributs dans un document Word réel
// (w:rsidR, w:rsidRPr…) : matcher `<w:r>` sans attributs (comme une première
// version le faisait) ne trouve alors quasiment aucun run dans un vrai
// fichier — d'où `<w:r\b[^>]*>`, qui les accepte tous.
const RUN_RE = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
const RPR_RE = /^<w:rPr>([\s\S]*?)<\/w:rPr>/;
const T_RE = /<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
// Un run "texte simple" ne contient (après sa <w:rPr> éventuelle) que des
// <w:t> — pas de tabulation, saut de ligne, image, champ… Seuls ceux-là
// peuvent être fusionnés sans risquer de perdre autre chose qu'ils
// contiendraient.
const SIMPLE_TEXT_ONLY_RE = /^(?:<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>)+$/;

/** Nombre de "[" non refermés par un "]" dans `text` — sert à savoir si un
 * run se termine au milieu d'une balise "[xxx]" commencée. */
function openBracketCount(text: string): number {
  let count = 0;
  for (const ch of text) {
    if (ch === "[") count++;
    else if (ch === "]" && count > 0) count--;
  }
  return count;
}

/** Word (et Google Docs) coupe souvent une balise tapée d'un bloc, ex.
 * "[nom_bailleur]", en plusieurs `<w:r>` internes — invisible à l'oeil dans
 * le document, mais invisible aussi à une simple recherche de
 * "[nom_bailleur]" dans le XML brut (le correcteur orthographique/
 * grammatical, des signets insérés automatiquement, un saut de page mémorisé
 * par Word, ou tout simplement une partie de la balise tapée avec une mise
 * en forme différente — ex. en gras — en sont les causes les plus
 * fréquentes). On supprime ces marqueurs muets puis on fusionne les `<w:r>`
 * consécutifs avant de chercher les balises — de même mise en forme, ou de
 * mise en forme différente si on est encore au milieu d'un "[...]" non
 * refermé (dans ce cas, le "]" pouvant arriver dans un tout autre style ne
 * doit pas empêcher de reconnaître la balise), pour que "tapé normalement
 * dans Word" suffise à ce qu'une balise soit reconnue. */
function normalizeRuns(xml: string): string {
  const out = xml
    .replace(/<w:proofErr[^>]*\/>/g, "")
    .replace(/<w:bookmarkStart[^>]*\/>/g, "")
    .replace(/<w:bookmarkEnd[^>]*\/>/g, "")
    .replace(/<w:lastRenderedPageBreak[^>]*\/>/g, "");

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
    const [full, inner] = match;
    const gapText = out.slice(lastIndex, match.index);

    const rprMatch = RPR_RE.exec(inner);
    const rPr = rprMatch ? rprMatch[1] : "";
    const afterRpr = rprMatch ? inner.slice(rprMatch[0].length) : inner;

    if (!SIMPLE_TEXT_ONLY_RE.test(afterRpr)) {
      // Run "opaque" (tabulation, saut de ligne, image, champ…) : on le
      // laisse tel quel sans jamais fusionner à travers, pour ne rien
      // perdre de son contenu.
      if (gapText.length > 0) {
        flush();
        result += gapText;
      }
      flush();
      result += full;
      lastIndex = match.index + full.length;
      continue;
    }

    let text = "";
    let attrs = "";
    T_RE.lastIndex = 0;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = T_RE.exec(afterRpr))) {
      text += tMatch[2];
      attrs = tMatch[1] || attrs;
    }

    // Un blanc pur entre deux `<w:r>` (retour à la ligne d'un export, etc.)
    // n'a aucun effet visuel dans Word : on l'ignore plutôt que de le
    // laisser casser la fusion de deux runs qui, sinon, se suivraient.
    if (gapText.trim().length > 0) {
      flush();
      result += gapText;
    }
    if (pending && (pending.rPr === rPr || openBracketCount(pending.text) > 0)) {
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

function formatAmountFr(value: number | null): string {
  if (value == null) return "";
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

function countMainRooms(rooms: Room[]): number {
  return rooms.filter((r) => r.name.startsWith("Chambre") || r.name.startsWith("Salon")).length;
}

function listRoomNames(rooms: Room[]): string {
  return rooms.map((r) => r.name).join(", ");
}

/** Balises du modèle de bail (voir `assets/bail-template.docx`) déjà
 * remplissables avec les données du système. Les balises absentes de cet
 * objet (ex. [enddate_agreement]) ne sont pas suivies dans le système :
 * elles restent visibles telles quelles dans le document généré, à
 * compléter ou retirer manuellement avant signature. */
function buildFieldMap(input: {
  property: Property;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  agencement: PropertyAgencement | null;
  waterElec: PropertyWaterElec | null;
  rooms: Room[];
}): Record<string, string> {
  const { property, owner, details, agencement, waterElec, rooms } = input;
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
    nbrepieces_appart: rooms.length ? String(countMainRooms(rooms)) : "",
    designation_appart: listRoomNames(rooms),
    productioneau_appart: formatProduction(waterElec?.hotWaterProduction ?? null),
    productionchauffage_appart: formatProduction(waterElec?.heatingProduction ?? null),
    detailsyndic_appart: formatSyndic(details),
    clés_appart: formatKeys(details),
    nombre_cles_appart: owner?.leaseKeyCount ?? "",
    // Durée / loyer
    startdate_agreement: formatDateFr(owner?.leaseStartDate ?? null),
    initialterm_agreement: owner?.leaseInitialTerm ?? "",
    termrenew_agreement: owner?.leaseRenewalTerm ?? "",
    loyerchiffre_agreement: rent ? formatAmountFr(rent) : "",
    loyerlettre_agreement: rent ? `${numberToFrenchWords(rent).toUpperCase()} EUROS` : "",
    chargeschiffre_agreement: charges ? formatAmountFr(charges) : "",
    chargeslettre_agreement: charges ? `${numberToFrenchWords(charges).toUpperCase()} EUROS` : "",
    totalchiffre_agreement: total ? formatAmountFr(total) : "",
    totallettre_agreement: total ? `${numberToFrenchWords(total).toUpperCase()} EUROS` : "",
    autrelabel_agreement: owner?.otherAmountLabel ?? "",
    autrechiffre_agreement: owner?.otherAmount ? formatAmountFr(owner.otherAmount) : "",
    autrelettre_agreement: owner?.otherAmount ? `${numberToFrenchWords(owner.otherAmount).toUpperCase()} EUROS` : "",
  };
}

/** Balises correspondant au nom de colonne Excel affiché par le badge "#"
 * au survol de chaque champ dans l'app (ex. [Nom Owner], [Société
 * Locataire]) — pour utiliser dans un modèle de bail le même nom déjà vu
 * ailleurs dans l'application plutôt qu'un second vocabulaire séparé. */
const HASHTAG_FIELD_KEYS: CsvFieldKey[] = [
  "name",
  "address",
  "surface",
  "syndicLotNumber",
  "syndicName",
  "syndicPhone",
  "syndicEmail",
  "hotWaterProduction",
  "heatingProduction",
  "ownerLastName",
  "ownerFirstName",
  "ownerEmail",
  "ownerPhone",
  "ownerAddress",
  "ownerBirthDate",
  "ownerBirthPlace",
  "ownerNationality",
  "ownerPassportNumber",
  "ownerCompanyName",
  "ownerCompanyLegalForm",
  "ownerCompanyCapital",
  "ownerCompanyAddress",
  "ownerCompanySiren",
  "ownerCompanyRcsCity",
  "ownerCompanyRepresentedBy",
  "ownerCompanyRole",
  "ownerNotes",
  "leaseStartDate",
  "leaseInitialTerm",
  "leaseRenewalTerm",
  "leaseRentFreePeriod",
  "leaseTenantCompany",
  "leaseTenantDirector",
  "leaseTenantNotes",
  "leaseSpecialClause1",
  "leaseSpecialClause2",
  "leaseTenantTerminationDelay",
  "leaseTenantNotice",
  "leaseOwnerTerminationDelay",
  "leaseOwnerNotice",
  "leaseNotes",
  "ribNotes",
  "rcpNotes",
  "rentType",
  "rentNotes",
  "rentAmount",
  "chargesAmount",
  "otherAmountLabel",
  "otherAmount",
];

function buildHashtagFieldMap(input: {
  property: Property;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  agencement: PropertyAgencement | null;
  waterElec: PropertyWaterElec | null;
}): Record<string, string> {
  const { property, owner, details, agencement, waterElec } = input;

  const values: Partial<Record<CsvFieldKey, string>> = {
    name: property.name ?? "",
    address: property.address ?? "",
    surface: agencement?.surface != null ? String(agencement.surface) : "",
    syndicLotNumber: details?.syndicLotNumber ?? "",
    syndicName: details?.syndicName ?? "",
    syndicPhone: details?.syndicPhone ?? "",
    syndicEmail: details?.syndicEmail ?? "",
    hotWaterProduction: formatProduction(waterElec?.hotWaterProduction ?? null),
    heatingProduction: formatProduction(waterElec?.heatingProduction ?? null),
    ownerLastName: owner?.lastName ?? "",
    ownerFirstName: owner?.firstName ?? "",
    ownerEmail: owner?.email ?? "",
    ownerPhone: owner?.phone ?? "",
    ownerAddress: owner?.address ?? "",
    ownerBirthDate: formatDateFr(owner?.birthDate ?? null),
    ownerBirthPlace: owner?.birthPlace ?? "",
    ownerNationality: owner?.nationality ?? "",
    ownerPassportNumber: owner?.passportNumber ?? "",
    ownerCompanyName: owner?.companyName ?? "",
    ownerCompanyLegalForm: owner?.companyLegalForm ?? "",
    ownerCompanyCapital: owner?.companyCapital ?? "",
    ownerCompanyAddress: owner?.companyAddress ?? "",
    ownerCompanySiren: owner?.companySiren ?? "",
    ownerCompanyRcsCity: owner?.companyRcsCity ?? "",
    ownerCompanyRepresentedBy: owner?.companyRepresentedBy ?? "",
    ownerCompanyRole: owner?.companyRole ?? "",
    ownerNotes: owner?.notes ?? "",
    leaseStartDate: formatDateFr(owner?.leaseStartDate ?? null),
    leaseInitialTerm: owner?.leaseInitialTerm ?? "",
    leaseRenewalTerm: owner?.leaseRenewalTerm ?? "",
    leaseRentFreePeriod: owner?.leaseRentFreePeriod ?? "",
    leaseTenantCompany: owner?.leaseTenantCompany ?? "",
    leaseTenantDirector: owner?.leaseTenantDirector ?? "",
    leaseTenantNotes: owner?.leaseTenantNotes ?? "",
    leaseSpecialClause1: owner?.leaseSpecialClause1 ?? "",
    leaseSpecialClause2: owner?.leaseSpecialClause2 ?? "",
    leaseTenantTerminationDelay: owner?.leaseTenantTerminationDelay ?? "",
    leaseTenantNotice: owner?.leaseTenantNotice ?? "",
    leaseOwnerTerminationDelay: owner?.leaseOwnerTerminationDelay ?? "",
    leaseOwnerNotice: owner?.leaseOwnerNotice ?? "",
    leaseNotes: owner?.leaseNotes ?? "",
    ribNotes: owner?.ribNotes ?? "",
    rcpNotes: owner?.rcpNotes ?? "",
    rentType: owner?.rentType ?? "",
    rentNotes: owner?.rentNotes ?? "",
    rentAmount: formatAmountFr(owner?.rentAmount ?? null),
    chargesAmount: formatAmountFr(owner?.chargesAmount ?? null),
    otherAmountLabel: owner?.otherAmountLabel ?? "",
    otherAmount: formatAmountFr(owner?.otherAmount ?? null),
  };

  const result: Record<string, string> = {};
  for (const key of HASHTAG_FIELD_KEYS) {
    result[CSV_FIELDS[key].header] = values[key] ?? "";
  }
  return result;
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
  rooms: Room[];
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
  const fields = { ...buildFieldMap(input), ...buildHashtagFieldMap(input) };
  for (const [key, value] of Object.entries(fields)) {
    xml = xml.split(`[${key}]`).join(escapeXml(value));
  }

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

/** Balises recommandées pour construire un modèle de bail : le nom de
 * colonne Excel affiché par le badge "#" au survol de chaque champ ailleurs
 * dans l'app (ex. [Nom Owner]) — un seul vocabulaire à connaître dans toute
 * l'application. */
export function listSupportedLeaseTags(): string[] {
  return HASHTAG_FIELD_KEYS.map((key) => CSV_FIELDS[key].header);
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
