"use client";

import { useRouter } from "next/navigation";
import { BULK_FIELDS, type BulkFieldGroup } from "@/lib/inventaire/bulkFields";

const GROUP_ORDER: BulkFieldGroup[] = ["Plateformes", "Propriétaire", "Agencement", "Détails"];

export function FieldSelector({ fieldId }: { fieldId: string }) {
  const router = useRouter();

  return (
    <div>
      <label className="field-label" htmlFor="bulk-field">
        Champ à compléter
      </label>
      <select
        id="bulk-field"
        defaultValue={fieldId}
        onChange={(e) => router.push(`/inventaire/completer?field=${encodeURIComponent(e.target.value)}`)}
        className="field-input max-w-sm"
      >
        {GROUP_ORDER.map((group) => (
          <optgroup key={group} label={group}>
            {BULK_FIELDS.filter((f) => f.group === group).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
