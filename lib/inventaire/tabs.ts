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
  { key: "data", code: "DATA", label: "DATA - Données" },
  { key: "photos", code: "AN", label: "AN - Annonce" },
  { key: "notes", code: "AU", label: "AU - Autres" },
  { key: "plateformes", code: "OTA", label: "OTA" },
  { key: "historique", code: "LOG", label: "LOG" },
  { key: "taches", code: "TA", label: "TA - Tâches" },
  { key: "documents", code: "DOC", label: "DOC - Docs" },
  { key: "bail", code: "BL", label: "BL - Bail" },
  { key: "finances", code: "FIN", label: "FIN - Finances" },
  { key: "calendrier", code: "CAL", label: "CAL - Calendrier" },
  { key: "proprietaire", code: "OW", label: "OW - Owner" },
  { key: "manquant", code: "MIS", label: "MIS - Manquant" },
] as const;

export type PropertyTabKey = (typeof PROPERTY_TABS)[number]["key"];

// Onglets fermés par défaut même sans restriction configurée pour un rôle
// (contrairement aux autres onglets, qui restent visibles "par défaut" tant
// qu'aucune restriction n'est configurée) : un admin les voit toujours, un
// autre rôle doit se les voir accorder explicitement dans "Autorisations
// par rôle" — voir PropertyTabs.tsx.
export const ADMIN_ONLY_BY_DEFAULT_TABS = new Set([
  "proprietaire",
  "documents",
  "bail",
  "finances",
  "calendrier",
]);

// Items du menu du haut (réservés aux admins par défaut) — mêmes clés
// utilisées dans `role_permissions.allowed_tabs` pour donner à un rôle non-
// admin l'accès à l'un de ces écrans, en plus de ses onglets de bien.
export const TOP_MENU_ITEMS = [
  { key: "menu_utilisateurs", label: "Menu — Utilisateurs" },
  { key: "menu_bail_type", label: "Menu — Bail type" },
  { key: "menu_import", label: "Menu — Importer" },
  { key: "menu_completer", label: "Menu — Compléter" },
  { key: "menu_journal", label: "Menu — Journal" },
  { key: "menu_acces", label: "Menu — Accès" },
  { key: "menu_api", label: "Menu — API" },
  { key: "menu_planning", label: "Menu — Planning" },
] as const;

/** Options combinées (tous les onglets de bien + tous les items du menu du
 * haut) proposées dans l'éditeur d'autorisations d'un rôle — une seule
 * liste, un seul champ `role_permissions.allowed_tabs`, comme demandé
 * ("vaut aussi pour le menu du dessus"). Partagé par tous les utilisateurs
 * d'un même rôle. Dérivée directement de PROPERTY_TABS (la source unique) :
 * tout nouvel onglet de bien apparaît donc automatiquement ici, sans liste
 * à tenir à jour à la main. */
export const SELECTABLE_SECTIONS = [...PROPERTY_TABS, ...TOP_MENU_ITEMS];

/** Un admin voit toujours tout ; les autres rôles ne sont restreints que si
 * leur rôle a une liste `allowedTabs` non vide configurée dans
 * `role_permissions` (comportement par défaut inchangé pour tout rôle sans
 * configuration). */
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
