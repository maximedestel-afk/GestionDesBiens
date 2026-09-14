export type BulkFieldGroup = "Plateformes" | "Propriétaire" | "Agencement" | "Détails" | "Eau/Élec";

export interface BulkFieldOption {
  value: string;
  label: string;
}

export interface BulkFieldDef {
  id: string;
  label: string;
  group: BulkFieldGroup;
  /** Nom du champ dans le FormData envoyé à l'action de sauvegarde correspondante. */
  formKey: string;
  inputType: "text" | "number" | "select";
  options?: BulkFieldOption[];
  placeholder?: string;
  /** "number" uniquement : attribut HTML step (ex. "1" pour un entier, "any" pour un montant). */
  step?: string;
}

const OUI_NON_OPTIONS: BulkFieldOption[] = [
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" },
];

function platformFields(type: string, label: string): BulkFieldDef[] {
  return [
    { id: `platform-${type}-reference`, label: `Référence ${label}`, group: "Plateformes", formKey: "value", inputType: "text" },
    { id: `platform-${type}-listing-name`, label: `Nom annonce ${label}`, group: "Plateformes", formKey: "value", inputType: "text" },
    { id: `platform-${type}-url`, label: `URL ${label}`, group: "Plateformes", formKey: "value", inputType: "text" },
    { id: `platform-${type}-notes`, label: `Note ${label}`, group: "Plateformes", formKey: "value", inputType: "text" },
  ];
}

// Champs disponibles pour l'édition en masse (page "Compléter en masse") :
// un champ à la fois, toutes les fiches affichées avec un input éditable.
// Chaque entrée doit correspondre à un champ géré par une action de
// sauvegarde qui ne patch que les champs présents dans le FormData soumis
// (savePropertyOwner / saveAgencement / savePropertyDetails / saveWaterElec
// / bulkUpdatePlatformField), pour ne jamais écraser un champ voisin.
export const BULK_FIELDS: BulkFieldDef[] = [
  // Plateformes
  ...platformFields("airbnb", "Airbnb"),
  ...platformFields("booking", "Booking.com"),
  ...platformFields("vrbo", "Vrbo"),
  ...platformFields("hopper", "Hopper"),

  // Propriétaire
  { id: "owner_last_name", label: "Nom du propriétaire", group: "Propriétaire", formKey: "lastName", inputType: "text" },
  { id: "owner_first_name", label: "Prénom du propriétaire", group: "Propriétaire", formKey: "firstName", inputType: "text" },
  { id: "owner_email", label: "Email du propriétaire", group: "Propriétaire", formKey: "email", inputType: "text" },
  { id: "owner_phone", label: "Téléphone du propriétaire", group: "Propriétaire", formKey: "phone", inputType: "text" },
  { id: "owner_address", label: "Adresse du propriétaire", group: "Propriétaire", formKey: "address", inputType: "text" },
  { id: "owner_birth_date", label: "Date de naissance", group: "Propriétaire", formKey: "birthDate", inputType: "text" },
  { id: "owner_birth_place", label: "Lieu de naissance", group: "Propriétaire", formKey: "birthPlace", inputType: "text" },
  { id: "owner_nationality", label: "Nationalité", group: "Propriétaire", formKey: "nationality", inputType: "text" },
  { id: "owner_passport_number", label: "Numéro de passeport", group: "Propriétaire", formKey: "passportNumber", inputType: "text" },
  { id: "is_company", label: "Propriétaire = société", group: "Propriétaire", formKey: "isCompany", inputType: "select", options: OUI_NON_OPTIONS },
  { id: "company_name", label: "Nom société", group: "Propriétaire", formKey: "companyName", inputType: "text" },
  { id: "company_legal_form", label: "Forme société", group: "Propriétaire", formKey: "companyLegalForm", inputType: "text" },
  { id: "company_capital", label: "Capital société", group: "Propriétaire", formKey: "companyCapital", inputType: "text" },
  { id: "company_address", label: "Adresse société", group: "Propriétaire", formKey: "companyAddress", inputType: "text" },
  { id: "company_siren", label: "SIREN société", group: "Propriétaire", formKey: "companySiren", inputType: "text" },
  { id: "company_rcs_city", label: "Ville RCS", group: "Propriétaire", formKey: "companyRcsCity", inputType: "text" },
  { id: "company_represented_by", label: "Représenté par", group: "Propriétaire", formKey: "companyRepresentedBy", inputType: "text" },
  { id: "company_role", label: "Qualité (ex. gérant)", group: "Propriétaire", formKey: "companyRole", inputType: "text" },
  { id: "owner_notes", label: "Notes propriétaire", group: "Propriétaire", formKey: "notes", inputType: "text" },
  { id: "lease_notes", label: "Note Bail", group: "Propriétaire", formKey: "leaseNotes", inputType: "text" },
  { id: "rib_notes", label: "Note RIB", group: "Propriétaire", formKey: "ribNotes", inputType: "text" },
  { id: "rcp_notes", label: "Note RCP", group: "Propriétaire", formKey: "rcpNotes", inputType: "text" },
  { id: "rent_amount", label: "Loyer (montant)", group: "Propriétaire", formKey: "rentAmount", inputType: "number", placeholder: "€", step: "any" },
  { id: "charges_amount", label: "Charges", group: "Propriétaire", formKey: "chargesAmount", inputType: "number", placeholder: "€", step: "any" },
  { id: "other_amount_label", label: "Autre (précisez)", group: "Propriétaire", formKey: "otherAmountLabel", inputType: "text" },
  { id: "other_amount", label: "Autre (montant)", group: "Propriétaire", formKey: "otherAmount", inputType: "number", placeholder: "€", step: "any" },
  { id: "rent_notes", label: "Note loyer", group: "Propriétaire", formKey: "rentNotes", inputType: "text" },
  {
    id: "rent_type",
    label: "Modèle de loyer",
    group: "Propriétaire",
    formKey: "rentType",
    inputType: "select",
    options: [
      { value: "fixe", label: "Fixe" },
      { value: "variable", label: "Variable" },
      { value: "fixe_variable", label: "Fixe + Variable" },
    ],
  },

  // Agencement
  { id: "capacity", label: "Nombre de personnes maximum", group: "Agencement", formKey: "capacity", inputType: "number", step: "1" },
  { id: "surface", label: "Superficie (m²)", group: "Agencement", formKey: "surface", inputType: "number", step: "any" },

  // Détails — Appartement
  { id: "floor", label: "Étage", group: "Détails", formKey: "floor", inputType: "text" },
  { id: "has_elevator", label: "Ascenseur", group: "Détails", formKey: "hasElevator", inputType: "select", options: OUI_NON_OPTIONS },
  { id: "floor_elevator_notes", label: "Note étage/ascenseur", group: "Détails", formKey: "floorElevatorNotes", inputType: "text" },
  { id: "access_video_url", label: "Lien vidéo/photos d'accès", group: "Détails", formKey: "accessVideoUrl", inputType: "text" },
  { id: "trash_room_url", label: "Local Poubelle (lien)", group: "Détails", formKey: "trashRoomUrl", inputType: "text" },
  { id: "trash_room_notes", label: "Local Poubelle (note)", group: "Détails", formKey: "trashRoomNotes", inputType: "text" },

  // Détails — Codes & accès / clés
  { id: "access_code_client", label: "Code & accès — Client", group: "Détails", formKey: "accessCodeClient", inputType: "text" },
  { id: "access_code_cleaning", label: "Code & accès — Ménage/maintenance", group: "Détails", formKey: "accessCodeCleaning", inputType: "text" },
  { id: "access_code_backup", label: "Code & accès — Back up", group: "Détails", formKey: "accessCodeBackup", inputType: "text" },
  {
    id: "lock_type",
    label: "Type de serrure",
    group: "Détails",
    formKey: "lockType",
    inputType: "select",
    options: [
      { value: "cle", label: "Clé" },
      { value: "connectee", label: "Connectée" },
    ],
  },
  { id: "lock_static_codes_notes", label: "Codes Statiques", group: "Détails", formKey: "lockStaticCodesNotes", inputType: "text" },
  {
    id: "key_content_type",
    label: "Contenu du trousseau de clé",
    group: "Détails",
    formKey: "keyContentType",
    inputType: "select",
    options: [
      { value: "cle", label: "Clé" },
      { value: "cle_vigik", label: "Clé + Vigik" },
      { value: "autre", label: "Autre" },
    ],
  },
  { id: "key_content_detail", label: "Détail contenu du trousseau", group: "Détails", formKey: "keyContentDetail", inputType: "text" },
  { id: "key_set_note", label: "Note (trousseau de clé)", group: "Détails", formKey: "keySetNote", inputType: "text" },

  // Détails — Wifi
  { id: "wifi_network", label: "Réseau Wifi", group: "Détails", formKey: "wifiNetwork", inputType: "text" },
  { id: "wifi_code", label: "Code Wifi", group: "Détails", formKey: "wifiCode", inputType: "text" },
  { id: "wifi_pto_number", label: "Numéro PTO", group: "Détails", formKey: "wifiPtoNumber", inputType: "text" },
  { id: "wifi_pto_notes", label: "Note prise optique", group: "Détails", formKey: "wifiPtoNotes", inputType: "text" },
  { id: "wifi_notes", label: "Notes Wifi", group: "Détails", formKey: "wifiNotes", inputType: "text" },

  // Détails — EDF
  { id: "edf_prm", label: "Numéro PRM (EDF)", group: "Détails", formKey: "edfPrm", inputType: "text" },
  { id: "edf_notes", label: "Notes EDF", group: "Détails", formKey: "edfNotes", inputType: "text" },

  // Détails — Syndic
  { id: "syndic_name", label: "Nom du syndic", group: "Détails", formKey: "syndicName", inputType: "text" },
  { id: "syndic_phone", label: "Téléphone syndic", group: "Détails", formKey: "syndicPhone", inputType: "text" },
  { id: "syndic_email", label: "Email syndic", group: "Détails", formKey: "syndicEmail", inputType: "text" },
  { id: "syndic_notes", label: "Notes syndic", group: "Détails", formKey: "syndicNotes", inputType: "text" },

  // Détails — Divers
  { id: "comment", label: "Commentaire", group: "Détails", formKey: "comment", inputType: "text" },

  // Eau / Électricité / Gaz
  {
    id: "hot_water_production",
    label: "Production eau chaude",
    group: "Eau/Élec",
    formKey: "hotWaterProduction",
    inputType: "select",
    options: [
      { value: "individuelle", label: "Individuelle" },
      { value: "collective", label: "Collective" },
    ],
  },
  { id: "has_gas", label: "Gaz", group: "Eau/Élec", formKey: "hasGas", inputType: "select", options: OUI_NON_OPTIONS },
  {
    id: "heating_production",
    label: "Production Chauffage",
    group: "Eau/Élec",
    formKey: "heatingProduction",
    inputType: "select",
    options: [
      { value: "individuelle", label: "Individuelle" },
      { value: "collective", label: "Collective" },
      { value: "autre", label: "Autre" },
    ],
  },
  { id: "heating_production_notes", label: "Note Chauffage", group: "Eau/Élec", formKey: "heatingProductionNotes", inputType: "text" },
];

export function getBulkField(id: string): BulkFieldDef | undefined {
  return BULK_FIELDS.find((f) => f.id === id);
}

export type PlatformFieldColumn = "reference" | "url" | "listing_name" | "notes";

export interface PlatformBulkField {
  platformType: string;
  column: PlatformFieldColumn;
}

const PLATFORM_FIELD_RE = /^platform-([a-z]+)-(reference|url|listing-name|notes)$/;

/** Reconnaît un id de champ de type "platform-<type>-<colonne>" (voir
 * platformFields ci-dessus) et retourne le type de plateforme et la
 * colonne SQL à modifier. */
export function parsePlatformFieldId(fieldId: string): PlatformBulkField | null {
  const match = PLATFORM_FIELD_RE.exec(fieldId);
  if (!match) return null;
  const column: PlatformFieldColumn = match[2] === "listing-name" ? "listing_name" : (match[2] as PlatformFieldColumn);
  return { platformType: match[1], column };
}
