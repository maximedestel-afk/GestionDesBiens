// Liste des onglets de la fiche d'un bien — source unique, utilisée à la
// fois par la navigation (PropertyTabs), le choix des onglets visibles pour
// un utilisateur du rôle "prestataire" (page Utilisateurs), et le
// regroupement de l'onglet "Données manquantes" (affiché par code).
export const PROPERTY_TABS = [
  { key: "details", code: "DE", label: "DE - Détails" },
  { key: "cles", code: "CL", label: "CL - Clés" },
  { key: "agencement", code: "AG", label: "AG - Agencement" },
  { key: "equipements", code: "EQ", label: "EQ - Equipement" },
  { key: "inventaire", code: "IN", label: "IN - Inventaire" },
  { key: "eauelec", code: "UT", label: "UT - Eau / Élec" },
  { key: "photos", code: "PH", label: "PH - Photos" },
  { key: "notes", code: "AU", label: "AU - Autres" },
  { key: "plateformes", code: "OTA", label: "OTA" },
  { key: "historique", code: "LOG", label: "LOG" },
  { key: "taches", code: "TA", label: "TA - Tâches" },
  { key: "documents", code: "DOC", label: "DOC - Docs" },
  { key: "proprietaire", code: "OW", label: "OW - Owner" },
  { key: "manquant", code: "MIS", label: "MIS - Manquant" },
] as const;

export type PropertyTabKey = (typeof PROPERTY_TABS)[number]["key"];

// Les onglets Propriétaire et Documents restent toujours réservés aux
// administrateurs : on ne les propose pas dans le choix des onglets d'un
// prestataire.
export const PRESTATAIRE_SELECTABLE_TABS = PROPERTY_TABS.filter(
  (t) => t.key !== "proprietaire" && t.key !== "documents"
);

const CODE_BY_KEY: Record<string, string> = Object.fromEntries(PROPERTY_TABS.map((t) => [t.key, t.code]));
const ORDER_BY_KEY: Record<string, number> = Object.fromEntries(PROPERTY_TABS.map((t, i) => [t.key, i]));

/** Code court (2-3 lettres) d'un onglet à partir de sa clé — utilisé pour
 * référencer une page ailleurs dans l'appli (ex. onglet Données manquantes). */
export function tabCode(key: string): string {
  return CODE_BY_KEY[key] ?? key;
}

export function tabOrder(key: string): number {
  return ORDER_BY_KEY[key] ?? 999;
}
