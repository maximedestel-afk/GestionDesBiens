// Liste des onglets de la fiche d'un bien — source unique, utilisée à la
// fois par la navigation (PropertyTabs) et par le choix des onglets visibles
// pour un utilisateur du rôle "prestataire" (page Utilisateurs).
export const PROPERTY_TABS = [
  { key: "details", label: "Détails appartement" },
  { key: "cles", label: "Clés/Serrure" },
  { key: "agencement", label: "Agencement" },
  { key: "equipements", label: "Équipements" },
  { key: "inventaire", label: "Inventaire" },
  { key: "eauelec", label: "Eau / Élec" },
  { key: "photos", label: "Photos" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "plateformes", label: "Plateformes" },
  { key: "proprietaire", label: "Propriétaire" },
  { key: "historique", label: "Log" },
  { key: "manquant", label: "Données manquantes" },
] as const;

export type PropertyTabKey = (typeof PROPERTY_TABS)[number]["key"];

// L'onglet Propriétaire reste toujours réservé aux administrateurs : on ne
// le propose pas dans le choix des onglets d'un prestataire.
export const PRESTATAIRE_SELECTABLE_TABS = PROPERTY_TABS.filter((t) => t.key !== "proprietaire");
