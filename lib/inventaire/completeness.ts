export interface CompletenessCheck {
  key: string;
  label: string;
  tab: string;
}

// Liste des éléments vérifiés pour l'indicateur "données manquantes"
// (badge sur la liste des biens + icônes à côté des champs dans les
// onglets). Un élément peut être marqué comme normalement vide pour un
// bien donné (property_checklist_dismissals), il n'est alors plus compté.
export const COMPLETENESS_CHECKS: CompletenessCheck[] = [
  { key: "owner_info", label: "Coordonnées du propriétaire", tab: "Propriétaire" },
  { key: "lease_contract", label: "Bail", tab: "Propriétaire" },
  { key: "rib", label: "RIB", tab: "Propriétaire" },
  { key: "rcp", label: "RCP", tab: "Propriétaire" },
  { key: "key_set_photo", label: "Photo du trousseau", tab: "Clés/Serrure" },
  { key: "capacity", label: "Nombre de personnes maximum", tab: "Agencement" },
  { key: "surface", label: "Superficie", tab: "Agencement" },
  { key: "visit_video", label: "Vidéo de visite", tab: "Agencement" },
  { key: "rooms", label: "Pièces & couchages", tab: "Agencement" },
  { key: "wifi_info", label: "Réseau et code Wifi", tab: "Détails appartement" },
  { key: "wifi_contract", label: "Contrat internet", tab: "Détails appartement" },
  { key: "edf_prm", label: "Numéro PRM (EDF)", tab: "Détails appartement" },
  { key: "edf_contract", label: "Contrat EDF", tab: "Détails appartement" },
  { key: "platforms_info", label: "Plateformes (Airbnb/Booking)", tab: "Plateformes" },
];

export interface PropertyCompletenessInput {
  ownerLastName: string | null | undefined;
  ownerEmail: string | null | undefined;
  hasLeaseContract: boolean;
  hasRib: boolean;
  hasRcp: boolean;
  hasKeySetPhoto: boolean;
  capacity: number | null | undefined;
  surface: number | null | undefined;
  hasVisitVideo: boolean;
  roomsCount: number;
  wifiNetwork: string | null | undefined;
  wifiCode: string | null | undefined;
  hasWifiContract: boolean;
  edfPrm: string | null | undefined;
  hasEdfContract: boolean;
  hasPlatformInfo: boolean;
}

const CHECK_PREDICATES: Record<string, (input: PropertyCompletenessInput) => boolean> = {
  owner_info: (i) => !!(i.ownerLastName || i.ownerEmail),
  lease_contract: (i) => i.hasLeaseContract,
  rib: (i) => i.hasRib,
  rcp: (i) => i.hasRcp,
  key_set_photo: (i) => i.hasKeySetPhoto,
  capacity: (i) => i.capacity != null,
  surface: (i) => i.surface != null,
  visit_video: (i) => i.hasVisitVideo,
  rooms: (i) => i.roomsCount > 0,
  wifi_info: (i) => !!(i.wifiNetwork && i.wifiCode),
  wifi_contract: (i) => i.hasWifiContract,
  edf_prm: (i) => !!i.edfPrm,
  edf_contract: (i) => i.hasEdfContract,
  platforms_info: (i) => i.hasPlatformInfo,
};

export function computeMissingChecks(
  input: PropertyCompletenessInput,
  dismissedKeys: ReadonlySet<string>
): CompletenessCheck[] {
  return COMPLETENESS_CHECKS.filter((check) => !dismissedKeys.has(check.key) && !CHECK_PREDICATES[check.key](input));
}

export function getCompletenessCheck(key: string): CompletenessCheck | undefined {
  return COMPLETENESS_CHECKS.find((check) => check.key === key);
}
