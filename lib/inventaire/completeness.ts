export interface CompletenessCheck {
  key: string;
  label: string;
  tab: string;
}

// Liste des éléments vérifiés pour l'indicateur "données manquantes" sur la
// liste des biens. Un élément peut être marqué comme normalement vide pour
// un bien donné (property_checklist_dismissals), il n'est alors plus compté.
export const COMPLETENESS_CHECKS: CompletenessCheck[] = [
  { key: "owner_info", label: "Coordonnées du propriétaire", tab: "Propriétaire" },
  { key: "lease_contract", label: "Bail", tab: "Propriétaire" },
  { key: "rib", label: "RIB", tab: "Propriétaire" },
  { key: "rcp", label: "RCP", tab: "Propriétaire" },
  { key: "key_set_photo", label: "Photo du trousseau", tab: "Clés/Serrure" },
  { key: "capacity", label: "Capacité d'accueil", tab: "Agencement" },
  { key: "wifi_info", label: "Réseau et code Wifi", tab: "Détails appartement" },
  { key: "wifi_contract", label: "Contrat internet", tab: "Détails appartement" },
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
  wifiNetwork: string | null | undefined;
  wifiCode: string | null | undefined;
  hasWifiContract: boolean;
  hasPlatformInfo: boolean;
}

const CHECK_PREDICATES: Record<string, (input: PropertyCompletenessInput) => boolean> = {
  owner_info: (i) => !!(i.ownerLastName || i.ownerEmail),
  lease_contract: (i) => i.hasLeaseContract,
  rib: (i) => i.hasRib,
  rcp: (i) => i.hasRcp,
  key_set_photo: (i) => i.hasKeySetPhoto,
  capacity: (i) => i.capacity != null,
  wifi_info: (i) => !!(i.wifiNetwork && i.wifiCode),
  wifi_contract: (i) => i.hasWifiContract,
  platforms_info: (i) => i.hasPlatformInfo,
};

export function computeMissingChecks(
  input: PropertyCompletenessInput,
  dismissedKeys: ReadonlySet<string>
): CompletenessCheck[] {
  return COMPLETENESS_CHECKS.filter((check) => !dismissedKeys.has(check.key) && !CHECK_PREDICATES[check.key](input));
}
