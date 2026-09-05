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
  { key: "proprietaire", label: "Propriétaire" },
  { key: "details", label: "Détails appartement" },
  { key: "eauelec", label: "Eau / Élec" },
  { key: "agencement", label: "Agencement" },
  { key: "equipements", label: "Équipements techniques" },
  { key: "inventaire", label: "Inventaire du foyer" },
  { key: "notes", label: "Notes" },
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
  const [activeTab, setActiveTab] = useState<TabKey>(isAdmin ? "proprietaire" : "details");

  const propertyAttachments = attachments.filter((a) => a.entityType === "property");
  const equipmentAttachments = attachments.filter((a) => a.entityType === "equipment");
  const inventoryAttachments = attachments.filter((a) => a.entityType === "inventory_item");
  const elementAttachments = attachments.filter((a) => a.entityType === "property_element");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <nav className="flex flex-wrap gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-md px-4 py-2 text-sm font-medium ${
                activeTab === tab.key
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mb-2 flex items-center gap-3 text-sm">
          <a href={`/inventaire/biens/${property.id}/export`} className="text-slate-600 hover:text-slate-900">
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
