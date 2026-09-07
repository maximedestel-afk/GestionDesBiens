import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentProfile,
  getProperty,
  getPropertyAgencement,
  getPropertyDetails,
  getPropertyOwner,
  getPropertyWaterElec,
  listActivityLog,
  listAttachmentsForProperty,
  listEquipment,
  listInventoryCategories,
  listInventoryItems,
  listPropertyElements,
  listPropertyKeys,
  listPropertyPlatforms,
  listRoomBeds,
  listRooms,
} from "@/lib/inventaire/queries";
import { PropertyTabs } from "./PropertyTabs";
import { EditPropertyDialog } from "@/components/inventaire/EditPropertyDialog";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const property = await getProperty(id);
  if (!property) notFound();

  const [
    profile,
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
    attachments,
    activityLog,
  ] = await Promise.all([
    getCurrentProfile(),
    getPropertyOwner(id),
    getPropertyDetails(id),
    listPropertyKeys(id),
    listPropertyPlatforms(id),
    getPropertyWaterElec(id),
    listPropertyElements(id, "water_elec"),
    getPropertyAgencement(id),
    listRooms(id),
    listRoomBeds(id),
    listEquipment(id),
    listInventoryItems(id),
    listInventoryCategories(id),
    listPropertyElements(id, "notes"),
    listPropertyElements(id, "photos"),
    listPropertyElements(id, "cles"),
    listPropertyElements(id, "owner_documents"),
    listPropertyElements(id, "documents"),
    listAttachmentsForProperty(id),
    listActivityLog(id, 30),
  ]);
  const isAdmin = profile?.role === "admin";

  return (
    <div>
      <div className="mb-6">
        <Link href="/inventaire" className="text-[13px] text-[#6e6e73] transition hover:text-[#1d1d1f]">
          ← Tous les biens
        </Link>
        <div className="mt-1 flex items-center">
          <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">
            {property.reference}
            {property.name && <span className="ml-2 font-normal text-[#6e6e73]">{property.name}</span>}
          </h1>
          <EditPropertyDialog property={property} />
        </div>
        {property.address && <p className="text-[14px] text-[#6e6e73]">{property.address}</p>}
      </div>

      <PropertyTabs
        property={property}
        isAdmin={isAdmin}
        owner={owner}
        details={details}
        keys={keys}
        platforms={platforms}
        waterElec={waterElec}
        waterElecElements={waterElecElements}
        agencement={agencement}
        rooms={rooms}
        beds={beds}
        equipment={equipment}
        inventoryItems={inventoryItems}
        inventoryCategories={inventoryCategories}
        noteElements={noteElements}
        photoAlbums={photoAlbums}
        keyElements={keyElements}
        ownerDocuments={ownerDocuments}
        documents={documents}
        attachments={attachments}
        activityLog={activityLog}
      />
    </div>
  );
}
