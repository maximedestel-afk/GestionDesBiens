"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { unstable_rethrow } from "next/navigation";
import type {
  ActivityLogEntry,
  Attachment,
  Equipment,
  InventoryCategoryRow,
  InventoryItem,
  Property,
  PropertyAgencement,
  PropertyDetails,
  PropertyElement,
  PropertyKey,
  PropertyOwner,
  PropertyPlatform,
  PropertyWaterElec,
  Room,
  RoomBed,
} from "@/lib/inventaire/types";
import { deleteProperty } from "@/lib/inventaire/actions";
import { getCompletenessCheck, type CompletenessCheck } from "@/lib/inventaire/completeness";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { DismissedChecksPanel } from "@/components/inventaire/DismissedChecksPanel";
import { OwnerTab } from "./OwnerTab";
import { DetailsTab } from "./DetailsTab";
import { KeysTab } from "./KeysTab";
import { PlatformsTab } from "./PlatformsTab";
import { WaterElecTab } from "./WaterElecTab";
import { AgencementTab } from "./AgencementTab";
import { EquipmentTab } from "./EquipmentTab";
import { InventoryTab } from "./InventoryTab";
import { NotesTab } from "./NotesTab";
import { PhotosTab } from "./PhotosTab";
import { DocumentsTab } from "./DocumentsTab";
import { ActivityLogPanel } from "./ActivityLogPanel";
import { MissingDataTab } from "./MissingDataTab";

const TABS = [
  { key: "details", label: "Détails appartement" },
  { key: "cles", label: "Clés/Serrure" },
  { key: "agencement", label: "Agencement" },
  { key: "equipements", label: "Équipements" },
  { key: "inventaire", label: "Inventaire" },
  { key: "eauelec", label: "Eau / Élec" },
  { key: "photos", label: "Photos" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "plateformes", label: "Plateformes" },
  { key: "proprietaire", label: "Propriétaire" },
  { key: "historique", label: "Log" },
  { key: "manquant", label: "Données manquantes" },
] as const;

const TAB_LABEL_TO_KEY: Record<string, (typeof TABS)[number]["key"]> = Object.fromEntries(
  TABS.map((t) => [t.label, t.key])
);

type TabKey = (typeof TABS)[number]["key"];

export function PropertyTabs({
  property,
  isAdmin,
  owner,
  details,
  keys,
  platforms,
  waterElec,
  waterElecElements,
  agencement,
  rooms,
  beds,
  equipment,
  inventoryItems,
  inventoryCategories,
  noteElements,
  photoAlbums,
  keyElements,
  ownerDocuments,
  documents,
  missingCheckKeys,
  dismissedChecks,
  attachments,
  activityLog,
}: {
  property: Property;
  isAdmin: boolean;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  keys: PropertyKey[];
  platforms: PropertyPlatform[];
  waterElec: PropertyWaterElec | null;
  waterElecElements: PropertyElement[];
  agencement: PropertyAgencement | null;
  rooms: Room[];
  beds: RoomBed[];
  equipment: Equipment[];
  inventoryItems: InventoryItem[];
  inventoryCategories: InventoryCategoryRow[];
  noteElements: PropertyElement[];
  photoAlbums: PropertyElement[];
  keyElements: PropertyElement[];
  ownerDocuments: PropertyElement[];
  documents: PropertyElement[];
  missingCheckKeys: string[];
  dismissedChecks: CompletenessCheck[];
  attachments: Attachment[];
  activityLog: ActivityLogEntry[];
}) {
  const visibleTabs = TABS.filter((tab) => tab.key !== "proprietaire" || isAdmin);

  // L'onglet actif est stocké dans l'URL (plutôt qu'un simple useState) pour
  // qu'il survive aux rafraîchissements déclenchés par l'enregistrement
  // automatique (revalidatePath) sur les autres onglets.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabKey = visibleTabs.some((tab) => tab.key === tabParam) ? (tabParam as TabKey) : "details";

  function setActiveTab(key: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const missingChecks = missingCheckKeys
    .map((key) => getCompletenessCheck(key))
    .filter((check): check is CompletenessCheck => !!check);

  function navigateToCheck(check: CompletenessCheck) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_LABEL_TO_KEY[check.tab] ?? "details");
    params.set("scrollTo", check.key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Fait défiler jusqu'à l'icône ⚠️ correspondante et la met brièvement en
  // évidence, une fois l'onglet ciblé actif (déclenché par navigateToCheck).
  useEffect(() => {
    const scrollTo = searchParams.get("scrollTo");
    if (!scrollTo) return;
    let attempts = 0;
    let cancelled = false;
    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(`missing-check-${scrollTo}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-400", "rounded-full");
        window.setTimeout(() => el.classList.remove("ring-2", "ring-amber-400", "rounded-full"), 2000);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("scrollTo");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else if (attempts < 20) {
        attempts++;
        requestAnimationFrame(tryScroll);
      }
    };
    requestAnimationFrame(tryScroll);
    return () => {
      cancelled = true;
    };
  }, [searchParams, activeTab, pathname, router]);

  const propertyAttachments = attachments.filter((a) => a.entityType === "property");
  const equipmentAttachments = attachments.filter((a) => a.entityType === "equipment");
  const inventoryAttachments = attachments.filter((a) => a.entityType === "inventory_item");
  const elementAttachments = attachments.filter((a) => a.entityType === "property_element");

  return (
    <div>
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-1">
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
              {tab.key === "manquant" && missingChecks.length > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                  {missingChecks.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-4 text-[13px]">
          <DismissedChecksPanel propertyId={property.id} checks={dismissedChecks} />
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
          <OwnerTab
            propertyId={property.id}
            owner={owner}
            attachments={propertyAttachments}
            documents={ownerDocuments}
            documentAttachments={elementAttachments}
            missingCheckKeys={missingCheckKeys}
          />
        )}
        {activeTab === "details" && (
          <DetailsTab
            propertyId={property.id}
            details={details}
            attachments={propertyAttachments}
            missingCheckKeys={missingCheckKeys}
          />
        )}
        {activeTab === "cles" && (
          <KeysTab
            propertyId={property.id}
            details={details}
            attachments={propertyAttachments}
            keys={keys}
            elements={keyElements}
            elementAttachments={elementAttachments}
            missingCheckKeys={missingCheckKeys}
          />
        )}
        {activeTab === "plateformes" && (
          <PlatformsTab propertyId={property.id} platforms={platforms} missingCheckKeys={missingCheckKeys} />
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
            beds={beds}
            attachments={propertyAttachments}
            missingCheckKeys={missingCheckKeys}
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
            categories={inventoryCategories}
            attachments={inventoryAttachments}
          />
        )}
        {activeTab === "photos" && (
          <PhotosTab propertyId={property.id} albums={photoAlbums} attachments={elementAttachments} />
        )}
        {activeTab === "documents" && (
          <DocumentsTab propertyId={property.id} documents={documents} attachments={elementAttachments} />
        )}
        {activeTab === "notes" && (
          <NotesTab propertyId={property.id} elements={noteElements} attachments={elementAttachments} />
        )}
        {activeTab === "historique" && <ActivityLogPanel entries={activityLog} />}
        {activeTab === "manquant" && <MissingDataTab checks={missingChecks} onNavigate={navigateToCheck} />}
      </div>
    </div>
  );
}
