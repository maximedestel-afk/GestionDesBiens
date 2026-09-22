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
  { key: "defauts", code: "DEF", label: "DEF - Défauts" },
  { key: "photos", code: "AN", label: "AN - Annonce" },
  { key: "notes", code: "AU", label: "AU - Autres" },
  { key: "plateformes", code: "OTA", label: "OTA" },
  { key: "historique", code: "LOG", label: "LOG" },
  { key: "taches", code: "TA", label: "TA - Tâches" },
  { key: "documents", code: "DOC", label: "DOC - Docs" },
  { key: "bail", code: "BL", label: "BL - Bail" },
  { key: "finances", code: "FIN", label: "FIN - Finances" },
  { key: "proprietaire", code: "OW", label: "OW - Owner" },
  { key: "manquant", code: "MIS", label: "MIS - Manquant" },
] as const;

export type PropertyTabKey = (typeof PROPERTY_TABS)[number]["key"];

// Les onglets Propriétaire, Documents, Bail et Finances restent toujours
// réservés aux administrateurs : on ne les propose pas dans le choix des
// onglets d'un prestataire.
export const PRESTATAIRE_SELECTABLE_TABS = PROPERTY_TABS.filter(
  (t) => t.key !== "proprietaire" && t.key !== "documents" && t.key !== "bail" && t.key !== "finances"
);

// Items du menu du haut (réservés aux admins par défaut) — mêmes clés
// utilisées dans `profiles.allowed_tabs` pour donner à un utilisateur non-
// admin l'accès à l'un de ces écrans, en plus de ses onglets de bien.
export const TOP_MENU_ITEMS = [
  { key: "menu_utilisateurs", label: "Menu — Utilisateurs" },
  { key: "menu_bail_type", label: "Menu — Bail type" },
  { key: "menu_import", label: "Menu — Importer" },
  { key: "menu_completer", label: "Menu — Compléter" },
  { key: "menu_journal", label: "Menu — Journal" },
  { key: "menu_acces", label: "Menu — Accès" },
] as const;

/** Options combinées (onglets de bien + items du menu du haut) proposées
 * dans l'éditeur d'accès d'un utilisateur — une seule liste, un seul champ
 * `allowed_tabs` en base, comme demandé ("vaut aussi pour le menu du
 * dessus"). */
export const SELECTABLE_SECTIONS = [...PRESTATAIRE_SELECTABLE_TABS, ...TOP_MENU_ITEMS];

/** Un admin voit toujours tout ; les autres rôles ne sont restreints que
 * s'ils ont une liste `allowedTabs` non vide (comportement par défaut
 * inchangé pour tous les comptes déjà existants, sans configuration). */
export function canAccessSection(
  role: string | null | undefined,
  allowedTabs: string[] | null | undefined,
  key: string
): boolean {
  if (role === "admin") return true;
  return (allowedTabs ?? []).includes(key);
}

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
