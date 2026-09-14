import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnerSessionEmail } from "@/lib/inventaire/ownerAuth";
import { serializePropertyDetails, serializePropertyOwner, serializeWaterElec } from "@/lib/inventaire/serialize";
import { OwnerSelfServiceForm } from "./OwnerSelfServiceForm";

export default async function OwnerPropertyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const email = await getOwnerSessionEmail();
  if (!email) redirect("/inventaire/proprietaire");

  const admin = createAdminClient();

  const { data: propertyRow } = await admin
    .from("properties")
    .select("id, reference, name")
    .eq("id", propertyId)
    .maybeSingle();
  if (!propertyRow) notFound();

  const { data: ownerRow } = await admin
    .from("property_owner")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!ownerRow || (ownerRow.email ?? "").toLowerCase() !== email) {
    redirect("/inventaire/proprietaire");
  }

  const [{ data: detailsRow }, { data: waterElecRow }] = await Promise.all([
    admin.from("property_details").select("*").eq("property_id", propertyId).maybeSingle(),
    admin.from("property_water_elec").select("*").eq("property_id", propertyId).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">
        {propertyRow.reference}
        {propertyRow.name && <span className="ml-2 text-[17px] font-normal text-[#6e6e73]">{propertyRow.name}</span>}
      </h1>
      <p className="mt-1.5 text-[15px] text-[#6e6e73]">
        Vérifiez et complétez vos informations ci-dessous, puis enregistrez.
      </p>

      <OwnerSelfServiceForm
        propertyId={propertyId}
        owner={serializePropertyOwner(ownerRow)}
        details={detailsRow ? serializePropertyDetails(detailsRow) : null}
        waterElec={waterElecRow ? serializeWaterElec(waterElecRow) : null}
      />
    </div>
  );
}
