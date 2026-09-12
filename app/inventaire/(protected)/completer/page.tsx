import { getCurrentProfile, listPropertiesForBulkField } from "@/lib/inventaire/queries";
import { BULK_FIELDS, getBulkField } from "@/lib/inventaire/bulkFields";
import { FieldSelector } from "./FieldSelector";
import { BulkFieldTable } from "./BulkFieldTable";

export default async function CompleterPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const { field } = await searchParams;
  const fieldId = (field && getBulkField(field)) ? field : BULK_FIELDS[0].id;
  const fieldDef = getBulkField(fieldId)!;

  const rows = await listPropertiesForBulkField(fieldId);

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Compléter en masse</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Choisissez un champ et renseignez-le pour tous les biens depuis une seule page.
      </p>

      <div className="mt-5">
        <FieldSelector fieldId={fieldId} />
      </div>

      <div className="mt-6 card overflow-visible p-0">
        <BulkFieldTable field={fieldDef} rows={rows} />
      </div>
    </div>
  );
}
