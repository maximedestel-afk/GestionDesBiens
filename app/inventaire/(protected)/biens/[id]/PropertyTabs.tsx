"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import type {
  ActivityLogEntry,
  Attachment,
  Equipment,
  InventoryItem,
  Property,
  PropertyAgencement,
  PropertyDetails,
  PropertyElement,
  PropertyOwner,
  PropertyWaterElec,
  Room,
} from "@/lib/inventaire/types";
import { deleteProperty } from "@/lib/inventaire/actions";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { OwnerTab } from "./OwnerTab";
import { DetailsTab } from "./DetailsTab";
import { WaterElecTab } from "./WaterElecTab";
import { AgencementTab } from "./AgencementTab";
import { EquipmentTab } from "./EquipmentTab";
import { InventoryTab } from "./InventoryTab";
import { NotesTab } from "./NotesTab";
import { ActivityLogPanel } from "./ActivityLogPanel";

const TABS = [
  { key: "details", label: "Détails appartement" },
  { key: "agencement", label: "Agencement" },
  { key: "equipements", label: "Équipements" },
  { key: "inventaire", label: "Inventaire" },
  { key: "eauelec", label: "Eau / Élec" },
  { key: "notes", label: "Notes" },
  { key: "proprietaire", label: "Propriétaire" },
  { key: "historique", label: "Historique" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PropertyTabs({
  property,
  isAdmin,
  owner,
  details,
  waterElec,
  waterElecElements,
  agencement,
  rooms,
  equipment,
  inventoryItems,
  noteElements,
  attachments,
  activityLog,
}: {
  property: Property;
  isAdmin: boolean;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  waterElec: PropertyWaterElec | null;
  waterElecElements: PropertyElement[];
  agencement: PropertyAgencement | null;
  rooms: Room[];
  equipment: Equipment[];
  inventoryItems: InventoryItem[];
  noteElements: PropertyElement[];
  attachments: Attachment[];
  activityLog: ActivityLogEntry[];
}) {
  const visibleTabs = TABS.filter((tab) => tab.key !== "proprietaire" || isAdmin);
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const propertyAttachments = attachments.filter((a) => a.entityType === "property");
  const equipmentAttachments = attachments.filter((a) => a.entityType === "equipment");
  const inventoryAttachments = attachments.filter((a) => a.entityType === "inventory_item");
  const elementAttachments = attachments.filter((a) => a.entityType === "property_element");

  return (
    <div>
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pill-tab ${
                activeTab === tab.key
                  ? "bg-[#1d1d1f] text-white"
                  : "text-[#6e6e73] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-4 text-[13px]">
          <a href={`/inventaire/biens/${property.id}/export`} className="link-quiet text-[13px]">
            Exporter (Excel)
          </a>
          <ConfirmDeleteButton
            label="Supprimer le bien"
            confirmText={`Supprimer définitivement « ${property.reference} » et toutes ses données ?`}
            action={async () => {
              try {
                await deleteProperty(property.id);
              } catch (e) {
                unstable_rethrow(e);
                throw e;
              }
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "proprietaire" && isAdmin && (
          <OwnerTab propertyId={property.id} owner={owner} attachments={propertyAttachments} />
        )}
        {activeTab === "details" && (
          <DetailsTab propertyId={property.id} details={details} attachments={propertyAttachments} />
        )}
        {activeTab === "eauelec" && (
          <WaterElecTab
            propertyId={property.id}
            waterElec={waterElec}
            elements={waterElecElements}
            attachments={elementAttachments}
          />
        )}
        {activeTab === "agencement" && (
          <AgencementTab
            propertyId={property.id}
            agencement={agencement}
            rooms={rooms}
            attachments={propertyAttachments}
          />
        )}
        {activeTab === "equipements" && (
          <EquipmentTab
            propertyId={property.id}
            rooms={rooms}
            equipment={equipment}
            attachments={equipmentAttachments}
          />
        )}
        {activeTab === "inventaire" && (
          <InventoryTab
            propertyId={property.id}
            items={inventoryItems}
            attachments={inventoryAttachments}
          />
        )}
        {activeTab === "notes" && (
          <NotesTab propertyId={property.id} elements={noteElements} attachments={elementAttachments} />
        )}
        {activeTab === "historique" && <ActivityLogPanel entries={activityLog} />}
      </div>
    </div>
  );
}
