export interface CompletenessCheck {
  key: string;
  label: string;
  tab: string;
}

// Liste des éléments vérifiés pour l'indicateur "données manquantes"
// (badge sur la liste des biens + icônes à côté des champs dans les
// onglets). Un élément peut être marqué comme normalement vide pour un
// bien donné (property_checklist_dismissals), il n'est alors plus compté.
// `tab` référence la clé de l'onglet (voir lib/inventaire/tabs.ts), pas son
// libellé affiché — le libellé/code à montrer se calcule à l'affichage.
export const COMPLETENESS_CHECKS: CompletenessCheck[] = [
  { key: "owner_info", label: "Coordonnées du propriétaire", tab: "proprietaire" },
  { key: "lease_contract", label: "Bail", tab: "documents" },
  { key: "rib", label: "RIB", tab: "proprietaire" },
  { key: "rent_amount", label: "Loyer (montant)", tab: "proprietaire" },
  { key: "rent_type", label: "Loyer (modèle Fixe / Fixe + Variable)", tab: "proprietaire" },
  { key: "rcp", label: "RCP", tab: "documents" },
  { key: "key_set_photo", label: "Photo du trousseau", tab: "cles" },
  { key: "capacity", label: "Nombre de personnes maximum", tab: "agencement" },
  { key: "surface", label: "Superficie", tab: "agencement" },
  { key: "visit_video", label: "Vidéo de visite", tab: "agencement" },
  { key: "rooms", label: "Pièces & couchages", tab: "agencement" },
  { key: "beds_missing", label: "Manque lit (pièces sans couchage)", tab: "agencement" },
  { key: "wifi_info", label: "Réseau et code Wifi", tab: "details" },
  { key: "wifi_contract", label: "Contrat internet", tab: "details" },
  { key: "edf_prm", label: "Numéro PRM (EDF)", tab: "details" },
  { key: "edf_contract", label: "Contrat EDF", tab: "details" },
  { key: "platforms_info", label: "Plateformes (Airbnb/Booking)", tab: "plateformes" },
  { key: "syndic_info", label: "Syndic", tab: "details" },
  { key: "trash_room_info", label: "Local Poubelle (vidéo/photo/note)", tab: "details" },
  { key: "wifi_pto_photo", label: "Photo Prise Optique et branchements", tab: "details" },
  { key: "keys_count", label: "Gestion des clés (au moins une clé)", tab: "cles" },
];

export interface PropertyCompletenessInput {
  ownerLastName: string | null | undefined;
  ownerEmail: string | null | undefined;
  hasLeaseContract: boolean;
  hasRib: boolean;
  rentAmount: number | null | undefined;
  rentType: string | null | undefined;
  hasRcp: boolean;
  hasKeySetPhoto: boolean;
  capacity: number | null | undefined;
  surface: number | null | undefined;
  hasVisitVideo: boolean;
  roomsCount: number;
  bedsCount: number;
  wifiNetwork: string | null | undefined;
  wifiCode: string | null | undefined;
  hasWifiContract: boolean;
  edfPrm: string | null | undefined;
  hasEdfContract: boolean;
  hasPlatformInfo: boolean;
  syndicName: string | null | undefined;
  syndicPhone: string | null | undefined;
  hasTrashRoomInfo: boolean;
  hasWifiPtoInfo: boolean;
  keysCount: number;
}

const CHECK_PREDICATES: Record<string, (input: PropertyCompletenessInput) => boolean> = {
  owner_info: (i) => !!(i.ownerLastName || i.ownerEmail),
  lease_contract: (i) => i.hasLeaseContract,
  rib: (i) => i.hasRib,
  rent_amount: (i) => i.rentAmount != null,
  rent_type: (i) => i.rentType != null,
  rcp: (i) => i.hasRcp,
  key_set_photo: (i) => i.hasKeySetPhoto,
  capacity: (i) => i.capacity != null,
  surface: (i) => i.surface != null,
  visit_video: (i) => i.hasVisitVideo,
  rooms: (i) => i.roomsCount > 0,
  beds_missing: (i) => !(i.roomsCount > 0 && i.bedsCount === 0),
  wifi_info: (i) => !!(i.wifiNetwork && i.wifiCode),
  wifi_contract: (i) => i.hasWifiContract,
  edf_prm: (i) => !!i.edfPrm,
  edf_contract: (i) => i.hasEdfContract,
  platforms_info: (i) => i.hasPlatformInfo,
  syndic_info: (i) => !!(i.syndicName || i.syndicPhone),
  trash_room_info: (i) => i.hasTrashRoomInfo,
  wifi_pto_photo: (i) => i.hasWifiPtoInfo,
  keys_count: (i) => i.keysCount > 0,
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
