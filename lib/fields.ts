// Catalogue des champs du modèle de bail meublé (contrat de location meublé,
// régime code civil / logement de fonction). Chaque champ appartient à une
// section, a un type de saisie, une assignation par défaut (qui le remplit
// par défaut : l'admin ou le client) et éventuellement une valeur par défaut
// suggérée (reprise du modèle) que l'admin peut modifier.

export type FieldType = "text" | "textarea" | "date" | "number" | "select";
export type AssignedTo = "admin" | "client" | "non_applicable";

export interface FieldCatalogEntry {
  key: string;
  label: string;
  section: string;
  type: FieldType;
  helpText?: string;
  options?: string[];
  defaultAssignedTo: AssignedTo;
  defaultValue?: string;
  required?: boolean;
}

export const SECTIONS = [
  "Bailleur",
  "Locataire",
  "Logement",
  "Durée du contrat",
  "Loyer et charges",
  "Dépôt de garantie",
  "Clauses particulières",
  "Clés",
  "Signature",
] as const;

export const FIELD_CATALOG: FieldCatalogEntry[] = [
  // BAILLEUR
  {
    key: "bailleur_nom",
    label: "Nom(s) et prénom(s) du/des bailleur(s)",
    section: "Bailleur",
    type: "textarea",
    defaultAssignedTo: "admin",
    defaultValue: "Mme Rebecca Benchitrit née le 22.07.1987 et Mr Michaël Benchitrit né le 19.07.1987",
    required: true,
  },
  {
    key: "bailleur_adresse",
    label: "Adresse du/des bailleur(s)",
    section: "Bailleur",
    type: "text",
    defaultAssignedTo: "admin",
    defaultValue: "Chemin des Crêts de Champel 28, 1206 Genève",
    required: true,
  },

  // LOCATAIRE
  {
    key: "locataire_type",
    label: "Type de locataire",
    section: "Locataire",
    type: "select",
    options: ["Particulier", "Société"],
    defaultAssignedTo: "client",
    required: true,
  },
  {
    key: "locataire_nom",
    label: "Nom / raison sociale du locataire",
    section: "Locataire",
    type: "text",
    defaultAssignedTo: "client",
    required: true,
  },
  {
    key: "locataire_date_naissance",
    label: "Date de naissance (si particulier)",
    section: "Locataire",
    type: "date",
    defaultAssignedTo: "client",
  },
  {
    key: "locataire_adresse",
    label: "Adresse / domicile du locataire",
    section: "Locataire",
    type: "textarea",
    defaultAssignedTo: "client",
    required: true,
  },
  {
    key: "locataire_rcs",
    label: "N° d'immatriculation / RCS (si société)",
    section: "Locataire",
    type: "text",
    defaultAssignedTo: "client",
  },
  {
    key: "locataire_siege_social",
    label: "Siège social (si société)",
    section: "Locataire",
    type: "text",
    defaultAssignedTo: "client",
  },
  {
    key: "locataire_representant",
    label: "Représenté par",
    section: "Locataire",
    type: "text",
    defaultAssignedTo: "client",
  },

  // LOGEMENT
  {
    key: "bien_adresse",
    label: "Adresse du logement loué",
    section: "Logement",
    type: "text",
    defaultAssignedTo: "admin",
    required: true,
  },
  {
    key: "bien_designation",
    label: "Désignation (étage, porte, duplex, etc.)",
    section: "Logement",
    type: "textarea",
    defaultAssignedTo: "admin",
  },
  {
    key: "bien_nb_pieces",
    label: "Nombre de pièces principales",
    section: "Logement",
    type: "number",
    defaultAssignedTo: "admin",
    required: true,
  },
  {
    key: "bien_surface",
    label: "Surface habitable (m²)",
    section: "Logement",
    type: "number",
    defaultAssignedTo: "admin",
    required: true,
  },
  {
    key: "bien_eau_chaude",
    label: "Production d'eau chaude sanitaire",
    section: "Logement",
    type: "select",
    options: ["Individuelle", "Collective"],
    defaultAssignedTo: "admin",
    defaultValue: "Individuelle",
  },
  {
    key: "bien_chauffage",
    label: "Production du chauffage",
    section: "Logement",
    type: "select",
    options: ["Individuelle", "Collective"],
    defaultAssignedTo: "admin",
    defaultValue: "Individuelle",
  },
  {
    key: "syndic_nom",
    label: "Syndic",
    section: "Logement",
    type: "text",
    defaultAssignedTo: "admin",
  },
  {
    key: "syndic_gestionnaire",
    label: "Gestionnaire (nom)",
    section: "Logement",
    type: "text",
    defaultAssignedTo: "admin",
  },
  {
    key: "syndic_telephone",
    label: "Téléphone du gestionnaire",
    section: "Logement",
    type: "text",
    defaultAssignedTo: "admin",
  },
  {
    key: "syndic_email",
    label: "Email du gestionnaire",
    section: "Logement",
    type: "text",
    defaultAssignedTo: "admin",
  },

  // DURÉE DU CONTRAT
  {
    key: "regime_contrat",
    label: "Régime du contrat",
    section: "Durée du contrat",
    type: "select",
    options: [
      "Logement soumis au code civil",
      "Logement de fonction (exclu de la loi du 6 juillet 1989)",
    ],
    defaultAssignedTo: "admin",
    defaultValue: "Logement de fonction (exclu de la loi du 6 juillet 1989)",
  },
  {
    key: "duree_mois",
    label: "Durée du contrat (en mois)",
    section: "Durée du contrat",
    type: "number",
    defaultAssignedTo: "admin",
    defaultValue: "24",
    required: true,
  },
  {
    key: "date_prise_effet",
    label: "Date de prise d'effet",
    section: "Durée du contrat",
    type: "date",
    defaultAssignedTo: "admin",
    required: true,
  },
  {
    key: "date_echeance",
    label: "Date d'échéance",
    section: "Durée du contrat",
    type: "date",
    defaultAssignedTo: "admin",
    required: true,
  },

  // LOYER ET CHARGES
  {
    key: "loyer_montant",
    label: "Montant du loyer mensuel (€)",
    section: "Loyer et charges",
    type: "number",
    defaultAssignedTo: "admin",
    required: true,
  },
  {
    key: "loyer_montant_lettres",
    label: "Montant du loyer en lettres",
    section: "Loyer et charges",
    type: "text",
    defaultAssignedTo: "admin",
  },
  {
    key: "charges_montant",
    label: "Charges forfaitaires mensuelles (€)",
    section: "Loyer et charges",
    type: "number",
    defaultAssignedTo: "admin",
  },
  {
    key: "charges_montant_lettres",
    label: "Charges forfaitaires en lettres",
    section: "Loyer et charges",
    type: "text",
    defaultAssignedTo: "admin",
  },
  {
    key: "terme_paiement",
    label: "Jour du mois auquel le loyer est payable",
    section: "Loyer et charges",
    type: "text",
    defaultAssignedTo: "admin",
    defaultValue: "30",
  },

  // DÉPÔT DE GARANTIE
  {
    key: "depot_garantie_montant",
    label: "Dépôt de garantie (montant ou \"Aucun\")",
    section: "Dépôt de garantie",
    type: "text",
    defaultAssignedTo: "admin",
    defaultValue: "Aucun dépôt de garantie n'a été exigé au titre du présent contrat.",
  },

  // CLAUSES PARTICULIÈRES
  {
    key: "sous_location_autorisee",
    label: "Sous-location autorisée ?",
    section: "Clauses particulières",
    type: "select",
    options: ["Oui, avec conditions", "Non"],
    defaultAssignedTo: "admin",
    defaultValue: "Oui, avec conditions",
  },
  {
    key: "franchise_loyer",
    label: "Franchise de loyer (montant / date de fin, le cas échéant)",
    section: "Clauses particulières",
    type: "textarea",
    defaultAssignedTo: "admin",
  },
  {
    key: "clause_libre",
    label: "Autre clause particulière (texte libre)",
    section: "Clauses particulières",
    type: "textarea",
    defaultAssignedTo: "admin",
  },

  // CLÉS
  {
    key: "nombre_cles",
    label: "Nombre et type de clés remises",
    section: "Clés",
    type: "text",
    defaultAssignedTo: "admin",
    defaultValue: "2 clés appartement et grille",
  },

  // SIGNATURE
  {
    key: "lieu_signature",
    label: "Lieu de signature",
    section: "Signature",
    type: "text",
    defaultAssignedTo: "admin",
  },
  {
    key: "date_signature",
    label: "Date de signature",
    section: "Signature",
    type: "date",
    defaultAssignedTo: "client",
  },
  {
    key: "nombre_originaux",
    label: "Nombre d'originaux",
    section: "Signature",
    type: "number",
    defaultAssignedTo: "admin",
    defaultValue: "2",
  },
];

export function fieldsBySection(): Record<string, FieldCatalogEntry[]> {
  const map: Record<string, FieldCatalogEntry[]> = {};
  for (const section of SECTIONS) map[section] = [];
  for (const field of FIELD_CATALOG) {
    if (!map[field.section]) map[field.section] = [];
    map[field.section].push(field);
  }
  return map;
}
