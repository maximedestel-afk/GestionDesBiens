import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentProfile,
  getPrestataireAllowedPropertyIds,
  getProperty,
  getPropertyAgencement,
  getPropertyDetails,
  getPropertyOwner,
  getPropertyWaterElec,
  listActivityLog,
  listAttachmentsForProperty,
  listChecklistDismissals,
  listEquipment,
  listInventoryCategories,
  listInventoryItems,
  listProfiles,
  listPropertyElements,
  listPropertyKeys,
  listPropertyPlatforms,
  listRoomBeds,
  listRooms,
  listTasks,
} from "@/lib/inventaire/queries";
import { computeMissingChecks, getCompletenessCheck } from "@/lib/inventaire/completeness";
import { PropertyTabs } from "./PropertyTabs";
import { EditPropertyDialog } from "@/components/inventaire/EditPropertyDialog";
import { PlatformLogo, platformTitle } from "@/components/inventaire/PlatformLogo";
import { PropertyStatsBar } from "@/components/inventaire/PropertyStatsBar";

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
    dismissedChecks,
    tasks,
    profiles,
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
    listActivityLog(id),
    listChecklistDismissals(id),
    listTasks(id),
    listProfiles(),
  ]);
  const isAdmin = profile?.role === "admin";

  if (profile?.role === "prestataire") {
    const allowedPropertyIds = await getPrestataireAllowedPropertyIds(profile.id);
    if (!allowedPropertyIds.includes(id)) notFound();
  }

  const platformHasListing = platforms.some((p) => !!p.listingName);
  const missingCheckKeys = computeMissingChecks(
    {
      ownerLastName: owner?.lastName,
      ownerEmail: owner?.email,
      hasLeaseContract: attachments.some((a) => a.kind === "lease_contract"),
      hasRib: attachments.some((a) => a.kind === "rib"),
      hasRcp: attachments.some((a) => a.kind === "rcp"),
      hasKeySetPhoto: attachments.some((a) => a.kind === "key_set_photo"),
      capacity: agencement?.capacity,
      surface: agencement?.surface,
      hasVisitVideo: attachments.some((a) => a.kind === "visit_video"),
      roomsCount: rooms.length,
      wifiNetwork: details?.wifiNetwork,
      wifiCode: details?.wifiCode,
      hasWifiContract: attachments.some((a) => a.kind === "wifi_contract"),
      edfPrm: details?.edfPrm,
      hasEdfContract: attachments.some((a) => a.kind === "edf_contract"),
      hasPlatformInfo: platformHasListing,
      syndicName: details?.syndicName,
      syndicPhone: details?.syndicPhone,
      hasTrashRoomInfo: !!(
        details?.trashRoomUrl ||
        details?.trashRoomNotes ||
        attachments.some((a) => a.kind === "trash_room")
      ),
      hasWifiPtoInfo: !!(
        details?.wifiPtoNumber ||
        details?.wifiPtoNotes ||
        attachments.some((a) => a.kind === "wifi_pto_photo")
      ),
      keysCount: keys.length,
    },
    new Set(dismissedChecks)
  ).map((check) => check.key);

  const dismissedChecksList = dismissedChecks
    .map((key) => getCompletenessCheck(key))
    .filter((check) => check !== undefined);

  const bedroomCount = rooms.filter((r) => r.name.startsWith("Chambre")).length;
  const bathroomCount =
    rooms.filter((r) => r.name.startsWith("SDB")).length +
    rooms.filter((r) => r.name.startsWith("WC")).length * 0.5;

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
          <div className="ml-2 flex items-center gap-1">
            {platforms
              .filter((p) => p.url)
              .map((p) => (
                <a
                  key={p.id}
                  href={p.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  title={`Ouvrir l'annonce ${platformTitle(p)}`}
                >
                  <PlatformLogo platformType={p.platformType} title={platformTitle(p)} className="h-6 w-6 text-[12px]" />
                </a>
              ))}
          </div>
          {profile?.role !== "prestataire" && <EditPropertyDialog property={property} />}
        </div>
        {property.address && <p className="text-[14px] text-[#6e6e73]">{property.address}</p>}
        <PropertyStatsBar bedroomCount={bedroomCount} bathroomCount={bathroomCount} capacity={agencement?.capacity ?? null} />
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
        missingCheckKeys={missingCheckKeys}
        dismissedChecks={dismissedChecksList}
        attachments={attachments}
        activityLog={activityLog}
        tasks={tasks}
        profiles={profiles}
        allowedTabs={profile?.allowedTabs ?? []}
      />
    </div>
  );
}
