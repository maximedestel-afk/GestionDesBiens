"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BulkFieldDef } from "@/lib/inventaire/bulkFields";
import { platformTypeFromFieldId } from "@/lib/inventaire/bulkFields";
import type { BulkFieldRow } from "@/lib/inventaire/queries";
import type { PlatformType } from "@/lib/inventaire/types";
import { savePropertyOwner, saveAgencement, savePropertyDetails, bulkUpdatePlatformReference } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";

const inputClass =
  "w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

function actionFor(field: BulkFieldDef) {
  const platformType = platformTypeFromFieldId(field.id);
  if (platformType) {
    return (propertyId: string, formData: FormData) =>
      bulkUpdatePlatformReference(propertyId, platformType as PlatformType, formData);
  }
  if (field.group === "Propriétaire") return savePropertyOwner;
  if (field.group === "Agencement") return saveAgencement;
  return savePropertyDetails;
}

function BulkFieldRowForm({ field, row }: { field: BulkFieldDef; row: BulkFieldRow }) {
  const action = actionFor(field);

  return (
    <li className="flex flex-col gap-2 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/inventaire/biens/${row.propertyId}`}
        className="flex min-w-0 flex-col text-[14px] text-[#1d1d1f] hover:underline sm:w-64 sm:shrink-0"
      >
        <span className="font-semibold">{row.propertyReference}</span>
        {row.propertyName && <span className="truncate text-[13px] text-[#6e6e73]">{row.propertyName}</span>}
      </Link>

      <ActionForm autoSave action={(formData) => action(row.propertyId, formData)} className="flex flex-1 items-center gap-3">
        {({ pending, error, success }) => (
          <>
            {field.inputType === "select" ? (
              <select name={field.formKey} defaultValue={row.value} className={inputClass}>
                <option value="">—</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={field.formKey}
                type={field.inputType === "number" ? "number" : "text"}
                step={field.inputType === "number" ? (field.step ?? "any") : undefined}
                min={field.inputType === "number" ? 0 : undefined}
                placeholder={field.placeholder ?? (row.value ? undefined : "Non renseigné")}
                defaultValue={row.value}
                className={!row.value ? `${inputClass} border-amber-300 bg-amber-50/40` : inputClass}
              />
            )}
            <div className="w-28 shrink-0">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
    </li>
  );
}

export function BulkFieldTable({ field, rows }: { field: BulkFieldDef; rows: BulkFieldRow[] }) {
  const [onlyMissing, setOnlyMissing] = useState(false);
  const missingCount = useMemo(() => rows.filter((r) => !r.value).length, [rows]);
  const visibleRows = onlyMissing ? rows.filter((r) => !r.value) : rows;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] text-[#6e6e73]">
          {missingCount === 0 ? "Tous les biens sont renseignés." : `${missingCount} bien(s) sans valeur pour ce champ.`}
        </p>
        <label className="flex shrink-0 items-center gap-2 text-[13px] text-[#1d1d1f]">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Afficher seulement les biens manquants
        </label>
      </div>
      <ul className="divide-y divide-black/[0.06]">
        {visibleRows.map((row) => (
          <BulkFieldRowForm key={row.propertyId} field={field} row={row} />
        ))}
      </ul>
    </div>
  );
}
