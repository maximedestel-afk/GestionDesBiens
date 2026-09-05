import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentProfile,
  getProperty,
  getPropertyAgencement,
  getPropertyDetails,
  getPropertyOwner,
  listActivityLog,
  listAttachmentsForProperty,
  listEquipment,
  listInventoryItems,
  listRooms,
} from "@/lib/inventaire/queries";
import { PropertyTabs } from "./PropertyTabs";
import { EditPropertyDialog } from "@/components/inventaire/EditPropertyDialog";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const property = await getProperty(id);
  if (!property) notFound();

  const [profile, owner, details, agencement, rooms, equipment, inventoryItems, attachments, activityLog] =
    await Promise.all([
      getCurrentProfile(),
      getPropertyOwner(id),
      getPropertyDetails(id),
      getPropertyAgencement(id),
      listRooms(id),
      listEquipment(id),
      listInventoryItems(id),
      listAttachmentsForProperty(id),
      listActivityLog(id, 30),
    ]);
  const isAdmin = profile?.role === "admin";

  return (
    <div>
      <div className="mb-4">
        <Link href="/inventaire" className="text-sm text-slate-500 hover:text-slate-700">
          ← Tous les biens
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {property.reference}
          {property.name && <span className="ml-2 font-normal text-slate-500">{property.name}</span>}
          <EditPropertyDialog property={property} />
        </h1>
        {property.address && <p className="text-sm text-slate-500">{property.address}</p>}
      </div>

      <PropertyTabs
        property={property}
        isAdmin={isAdmin}
        owner={owner}
        details={details}
        agencement={agencement}
        rooms={rooms}
        equipment={equipment}
        inventoryItems={inventoryItems}
        attachments={attachments}
        activityLog={activityLog}
      />
    </div>
  );
}
