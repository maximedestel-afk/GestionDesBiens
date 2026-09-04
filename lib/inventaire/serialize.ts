import type {
  ActivityLogEntry,
  Attachment,
  Equipment,
  InventoryItem,
  Profile,
  Property,
  PropertyAgencement,
  PropertyDetails,
  Room,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function serializeProperty(row: any): Property {
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function serializePropertyDetails(row: any): PropertyDetails {
  return {
    propertyId: row.property_id,
    floor: row.floor,
    hasElevator: row.has_elevator,
    accessCodeClient: row.access_code_client,
    accessCodeCleaning: row.access_code_cleaning,
    accessCodeBackup: row.access_code_backup,
    wifiNetwork: row.wifi_network,
    wifiCode: row.wifi_code,
    clientReference: row.client_reference,
    edfPrm: row.edf_prm,
    syndicName: row.syndic_name,
    syndicPhone: row.syndic_phone,
    syndicEmail: row.syndic_email,
    syndicNotes: row.syndic_notes,
  };
}

export function serializeAgencement(row: any): PropertyAgencement {
  return {
    propertyId: row.property_id,
    capacity: row.capacity,
    babyBed: row.baby_bed,
  };
}

export function serializeRoom(row: any): Room {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    description: row.description,
    position: row.position,
  };
}

export function serializeEquipment(row: any): Equipment {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomId: row.room_id,
    name: row.name,
    brand: row.brand,
    warranty: row.warranty,
    model: row.model,
    serialNumber: row.serial_number,
    dryingFunction: row.drying_function,
    videoLink: row.video_link,
    notes: row.notes,
    position: row.position,
  };
}

export function serializeInventoryItem(row: any): InventoryItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    category: row.category,
    name: row.name,
    inStock: row.in_stock,
    target: row.target,
    isTableware: row.is_tableware,
    effectiveTarget: row.effective_target,
    gap: row.gap,
    condition: row.condition,
    notes: row.notes,
    position: row.position,
    stockUpdatedAt: row.stock_updated_at,
  };
}

export function serializeAttachment(row: any, url: string | null = null): Attachment {
  return {
    id: row.id,
    propertyId: row.property_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    kind: row.kind,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    url,
  };
}

export function serializeActivityLogEntry(row: any): ActivityLogEntry {
  return {
    id: row.id,
    propertyId: row.property_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    actorEmail: row.actor_email,
    createdAt: row.created_at,
  };
}

export function serializeProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };
}
