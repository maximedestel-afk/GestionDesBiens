"use client";

import { ownerUploadRib, type OwnerRibFile } from "@/lib/inventaire/ownerActions";
import { ActionForm } from "@/components/inventaire/ActionForm";

export function OwnerRibUpload({ propertyId, existingFiles }: { propertyId: string; existingFiles: OwnerRibFile[] }) {
  return (
    <div>
      <label className="field-label">RIB</label>
      {existingFiles.length > 0 && (
        <ul className="mt-1 space-y-1 text-[13px] text-[#6e6e73]">
          {existingFiles.map((f) => (
            <li key={f.id}>📄 {f.fileName} (déjà envoyé)</li>
          ))}
        </ul>
      )}
      <ActionForm
        action={(formData) => ownerUploadRib(propertyId, formData)}
        resetOnSuccess
        className="mt-2 flex flex-wrap items-center gap-2"
      >
        {({ pending, error, success }) => (
          <>
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required className="text-[13px]" />
            <button type="submit" disabled={pending} className="btn-secondary btn-sm">
              {pending ? "Envoi…" : "Envoyer le RIB"}
            </button>
            {error && <span className="text-[13px] text-red-600">{error}</span>}
            {success && !pending && <span className="text-[13px] text-emerald-600">Envoyé ✓</span>}
          </>
        )}
      </ActionForm>
    </div>
  );
}
