/** Page "Compléter les données manquantes" : pour chaque check de
 * complétude qui correspond à un ou des champs simples (texte/nombre/choix
 * sur une seule table), la façon de l'afficher et de l'enregistrer en
 * ligne. Les checks nécessitant un fichier ou une sous-ressource (bail,
 * RIB, pièces, clés…) ne sont volontairement pas listés ici — ils restent
 * gérés depuis la fiche du bien. */
export type QuickFillAction = "owner" | "agencement" | "details";

export interface QuickFillFieldSpec {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
}

export interface QuickFillSpec {
  action: QuickFillAction;
  fields: QuickFillFieldSpec[];
}

export const QUICK_FILL_SPECS: Partial<Record<string, QuickFillSpec>> = {
  owner_info: {
    action: "owner",
    fields: [
      { name: "lastName", label: "Nom", type: "text" },
      { name: "email", label: "Email", type: "text" },
    ],
  },
  rent_amount: {
    action: "owner",
    fields: [{ name: "rentAmount", label: "Loyer (€)", type: "number" }],
  },
  rent_type: {
    action: "owner",
    fields: [
      {
        name: "rentType",
        label: "Modèle",
        type: "select",
        options: [
          { value: "fixe", label: "Fixe" },
          { value: "fixe_variable", label: "Fixe + Variable" },
        ],
      },
    ],
  },
  capacity: {
    action: "agencement",
    fields: [{ name: "capacity", label: "Capacité", type: "number" }],
  },
  surface: {
    action: "agencement",
    fields: [{ name: "surface", label: "Superficie (m²)", type: "number" }],
  },
  edf_prm: {
    action: "details",
    fields: [{ name: "edfPrm", label: "Numéro PRM", type: "text" }],
  },
  syndic_info: {
    action: "details",
    fields: [
      { name: "syndicName", label: "Nom du syndic", type: "text" },
      { name: "syndicPhone", label: "Téléphone", type: "text" },
    ],
  },
  wifi_info: {
    action: "details",
    fields: [
      { name: "wifiNetwork", label: "Réseau", type: "text" },
      { name: "wifiCode", label: "Code", type: "text" },
    ],
  },
};
