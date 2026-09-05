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
  PropertyOwner,
  Room,
} from "@/lib/inventaire/types";
import { deleteProperty } from "@/lib/inventaire/actions";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { OwnerTab } from "./OwnerTab";
import { DetailsTab } from "./DetailsTab";
import { AgencementTab } from "./AgencementTab";
import { EquipmentTab } from "./EquipmentTab";
import { InventoryTab } from "./InventoryTab";
import { ActivityLogPanel } from "./ActivityLogPanel";

const TABS = [
  { key: "proprietaire", label: "Propriétaire" },
  { key: "details", label: "Détails appartement" },
  { key: "agencement", label: "Agencement" },
  { key: "equipements", label: "Équipements techniques" },
  { key: "inventaire", label: "Inventaire du foyer" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PropertyTabs({
  property,
  owner,
  details,
  agencement,
  rooms,
  equipment,
  inventoryItems,
  attachments,
  activityLog,
}: {
  property: Property;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  agencement: PropertyAgencement | null;
  rooms: Room[];
  equipment: Equipment[];
  inventoryItems: InventoryItem[];
  attachments: Attachment[];
  activityLog: ActivityLogEntry[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("proprietaire");
  const [showHistory, setShowHistory] = useState(false);

  const propertyAttachments = attachments.filter((a) => a.entityType === "property");
  const equipmentAttachments = attachments.filter((a) => a.entityType === "equipment");
  const inventoryAttachments = attachments.filter((a) => a.entityType === "inventory_item");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <nav className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
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
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-slate-600 hover:text-slate-900"
          >
            Historique
          </button>
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

      {showHistory && (
        <div className="mt-4">
          <ActivityLogPanel entries={activityLog} />
        </div>
      )}

      <div className="mt-6">
        {activeTab === "proprietaire" && <OwnerTab propertyId={property.id} owner={owner} />}
        {activeTab === "details" && (
          <DetailsTab propertyId={property.id} details={details} attachments={propertyAttachments} />
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
      </div>
    </div>
  );
}
