export type BulkFieldGroup = "Plateformes" | "Propriétaire" | "Agencement" | "Détails";

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

// Champs disponibles pour l'édition en masse (page "Compléter en masse") :
// un champ à la fois, toutes les fiches affichées avec un input éditable.
// Chaque entrée doit correspondre à un champ géré par une action de
// sauvegarde qui ne patch que les champs présents dans le FormData soumis
// (savePropertyOwner / saveAgencement / savePropertyDetails /
// bulkUpdatePlatformReference), pour ne jamais écraser un champ voisin.
export const BULK_FIELDS: BulkFieldDef[] = [
  { id: "platform-airbnb-reference", label: "Référence Airbnb", group: "Plateformes", formKey: "reference", inputType: "text" },
  { id: "platform-booking-reference", label: "Référence Booking.com", group: "Plateformes", formKey: "reference", inputType: "text" },
  { id: "platform-vrbo-reference", label: "Référence Vrbo", group: "Plateformes", formKey: "reference", inputType: "text" },
  { id: "platform-hopper-reference", label: "Référence Hopper", group: "Plateformes", formKey: "reference", inputType: "text" },
  { id: "rent_amount", label: "Loyer (montant)", group: "Propriétaire", formKey: "rentAmount", inputType: "number", placeholder: "€", step: "any" },
  {
    id: "rent_type",
    label: "Modèle de loyer",
    group: "Propriétaire",
    formKey: "rentType",
    inputType: "select",
    options: [
      { value: "fixe", label: "Fixe" },
      { value: "fixe_variable", label: "Fixe + Variable" },
    ],
  },
  { id: "capacity", label: "Nombre de personnes maximum", group: "Agencement", formKey: "capacity", inputType: "number", step: "1" },
  { id: "surface", label: "Superficie (m²)", group: "Agencement", formKey: "surface", inputType: "number", step: "any" },
  { id: "edf_prm", label: "Numéro PRM (EDF)", group: "Détails", formKey: "edfPrm", inputType: "text" },
  { id: "wifi_network", label: "Réseau Wifi", group: "Détails", formKey: "wifiNetwork", inputType: "text" },
  { id: "wifi_code", label: "Code Wifi", group: "Détails", formKey: "wifiCode", inputType: "text" },
  { id: "syndic_name", label: "Nom du syndic", group: "Détails", formKey: "syndicName", inputType: "text" },
  { id: "syndic_phone", label: "Téléphone syndic", group: "Détails", formKey: "syndicPhone", inputType: "text" },
];

export function getBulkField(id: string): BulkFieldDef | undefined {
  return BULK_FIELDS.find((f) => f.id === id);
}

const PLATFORM_FIELD_RE = /^platform-([a-z]+)-reference$/;

export function platformTypeFromFieldId(fieldId: string): string | null {
  return PLATFORM_FIELD_RE.exec(fieldId)?.[1] ?? null;
}
