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
  listInventoryItems,
  listPropertyElements,
  listPropertyKeys,
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
    waterElec,
    waterElecElements,
    agencement,
    rooms,
    equipment,
    inventoryItems,
    noteElements,
    attachments,
    activityLog,
  ] = await Promise.all([
    getCurrentProfile(),
    getPropertyOwner(id),
    getPropertyDetails(id),
    listPropertyKeys(id),
    getPropertyWaterElec(id),
    listPropertyElements(id, "water_elec"),
    getPropertyAgencement(id),
    listRooms(id),
    listEquipment(id),
    listInventoryItems(id),
    listPropertyElements(id, "notes"),
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
        waterElec={waterElec}
        waterElecElements={waterElecElements}
        agencement={agencement}
        rooms={rooms}
        equipment={equipment}
        inventoryItems={inventoryItems}
        noteElements={noteElements}
        attachments={attachments}
        activityLog={activityLog}
      />
    </div>
  );
}
