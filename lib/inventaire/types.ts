export type UserRole = "admin" | "menage";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}

export interface Property {
  id: string;
  reference: string;
  name: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDetails {
  propertyId: string;
  floor: string | null;
  hasElevator: boolean | null;
  accessCodeClient: string | null;
  accessCodeCleaning: string | null;
  accessCodeBackup: string | null;
  wifiNetwork: string | null;
  wifiCode: string | null;
  clientReference: string | null;
  edfPrm: string | null;
  syndicName: string | null;
  syndicPhone: string | null;
  syndicEmail: string | null;
  syndicNotes: string | null;
  comment: string | null;
  lockType: "cle" | "connectee" | null;
  keyContentType: "cle" | "cle_vigik" | "autre" | null;
  keyContentDetail: string | null;
}

export interface PropertyOwner {
  propertyId: string;
  lastName: string | null;
  firstName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

export interface PropertyAgencement {
  propertyId: string;
  capacity: number | null;
  babyBed: boolean;
  surface: number | null;
}

export type HotWaterProduction = "individuelle" | "collective";

export interface PropertyWaterElec {
  propertyId: string;
  hotWaterProduction: HotWaterProduction | null;
  hasGas: boolean | null;
}

export type KeyType = "guest" | "menage" | "backup" | "autre";
export type KeyLocation = "boite_a_cle" | "locker" | "autre";

export interface PropertyKey {
  id: string;
  propertyId: string;
  keyType: KeyType | null;
  keyTypeDetail: string | null;
  location: KeyLocation | null;
  locationDetail: string | null;
  boxLocation: string | null;
  boxCode: string | null;
  lockerAddress: string | null;
  lockerCode: string | null;
  position: number;
}

export type ElementSection = "water_elec" | "notes";

export interface PropertyElement {
  id: string;
  propertyId: string;
  section: ElementSection;
  name: string;
  notes: string | null;
  position: number;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  description: string | null;
  position: number;
}

export interface Equipment {
  id: string;
  propertyId: string;
  roomId: string;
  name: string;
  brand: string | null;
  warranty: string | null;
  model: string | null;
  serialNumber: string | null;
  dryingFunction: boolean;
  videoLink: string | null;
  notes: string | null;
  position: number;
}

export const INVENTORY_CATEGORIES = [
  "Cuisine",
  "Chambre",
  "Salle de bain",
  "Salon",
  "Produits d'entretien",
  "Sécurité",
  "Divers",
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export type ItemCondition = "Bon" | "Usé" | "À remplacer";

export interface InventoryItem {
  id: string;
  propertyId: string;
  category: InventoryCategory;
  name: string;
  inStock: number;
  target: number | null;
  isTableware: boolean;
  effectiveTarget: number;
  gap: number;
  condition: ItemCondition;
  notes: string | null;
  position: number;
  stockUpdatedAt: string;
}

export type AttachmentEntityType = "property" | "equipment" | "inventory_item" | "property_element";

export type AttachmentKind =
  | "access_video"
  | "wifi_contract"
  | "client_contract"
  | "edf_contract"
  | "lease_contract"
  | "visit_video"
  | "equipment_photo"
  | "equipment_reference_photo"
  | "inventory_item_photo"
  | "element_photo"
  | "key_set_photo";

export interface Attachment {
  id: string;
  propertyId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  kind: AttachmentKind;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  url: string | null;
}

export interface ActivityLogEntry {
  id: string;
  propertyId: string;
  entityType: string;
  entityId: string | null;
  action: "create" | "update" | "delete";
  summary: string;
  actorEmail: string | null;
  createdAt: string;
}
