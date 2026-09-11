import type {
  ActivityLogEntry,
  Attachment,
  Equipment,
  InventoryItem,
  Profile,
  Property,
  PropertyAgencement,
  PropertyDetails,
  PropertyElement,
  PropertyKey,
  PropertyOwner,
  InventoryCategoryRow,
  PropertyPlatform,
  PropertyWaterElec,
  Room,
  RoomBed,
  Task,
  TaskComment,
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
    floorElevatorNotes: row.floor_elevator_notes,
    accessVideoUrl: row.access_video_url,
    trashRoomUrl: row.trash_room_url,
    trashRoomNotes: row.trash_room_notes,
    accessCodeClient: row.access_code_client,
    accessCodeCleaning: row.access_code_cleaning,
    accessCodeBackup: row.access_code_backup,
    wifiNetwork: row.wifi_network,
    wifiCode: row.wifi_code,
    wifiPtoNumber: row.wifi_pto_number,
    wifiPtoNotes: row.wifi_pto_notes,
    wifiNotes: row.wifi_notes,
    edfNotes: row.edf_notes,
    clientReference: row.client_reference,
    edfPrm: row.edf_prm,
    syndicName: row.syndic_name,
    syndicPhone: row.syndic_phone,
    syndicEmail: row.syndic_email,
    syndicNotes: row.syndic_notes,
    comment: row.comment,
    lockType: row.lock_type,
    lockStaticCodesNotes: row.lock_static_codes_notes,
    keyContentType: row.key_content_type,
    keyContentDetail: row.key_content_detail,
    keySetNote: row.key_set_note,
  };
}

export function serializePropertyOwner(row: any): PropertyOwner {
  return {
    propertyId: row.property_id,
    lastName: row.last_name,
    firstName: row.first_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    leaseNotes: row.lease_notes,
    ribNotes: row.rib_notes,
    rcpNotes: row.rcp_notes,
    rentType: row.rent_type,
    rentNotes: row.rent_notes,
    rentAmount: row.rent_amount,
    chargesAmount: row.charges_amount,
    otherAmountLabel: row.other_amount_label,
    otherAmount: row.other_amount,
  };
}

export function serializeAgencement(row: any): PropertyAgencement {
  return {
    propertyId: row.property_id,
    capacity: row.capacity,
    surface: row.surface,
  };
}

export function serializeWaterElec(row: any): PropertyWaterElec {
  return {
    propertyId: row.property_id,
    hotWaterProduction: row.hot_water_production,
    hasGas: row.has_gas,
    heatingProduction: row.heating_production,
    heatingProductionNotes: row.heating_production_notes,
  };
}

export function serializePropertyElement(row: any): PropertyElement {
  return {
    id: row.id,
    propertyId: row.property_id,
    section: row.section,
    name: row.name,
    notes: row.notes,
    url: row.url,
    position: row.position,
  };
}

export function serializePropertyKey(row: any): PropertyKey {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    notes: row.notes,
    keyType: row.key_type,
    keyTypeDetail: row.key_type_detail,
    location: row.location,
    locationDetail: row.location_detail,
    boxLocation: row.box_location,
    boxCode: row.box_code,
    lockerAddress: row.locker_address,
    lockerCode: row.locker_code,
    position: row.position,
  };
}

export function serializePropertyPlatform(row: any): PropertyPlatform {
  return {
    id: row.id,
    propertyId: row.property_id,
    platformType: row.platform_type,
    platformTypeDetail: row.platform_type_detail,
    listingName: row.listing_name,
    reference: row.reference,
    url: row.url,
    notes: row.notes,
    position: row.position,
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

export function serializeRoomBed(row: any): RoomBed {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomId: row.room_id,
    bedType: row.bed_type,
    bedTypeDetail: row.bed_type_detail,
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

export function serializeInventoryCategory(row: any): InventoryCategoryRow {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
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
    bedMultiplier: row.bed_multiplier,
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

export function serializeTaskComment(row: any): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    text: row.text,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
  };
}

export function serializeTask(row: any, comments: TaskComment[] = []): Task {
  return {
    id: row.id,
    propertyId: row.property_id,
    text: row.text,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    assignedTo: row.assigned_to,
    done: row.done,
    doneByEmail: row.done_by_email,
    doneAt: row.done_at,
    comments,
  };
}

export function serializeProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    allowedTabs: row.allowed_tabs ?? [],
  };
}
