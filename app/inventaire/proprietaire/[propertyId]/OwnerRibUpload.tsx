"use client";

import { useState, useTransition, type RefObject } from "react";
import { unstable_rethrow } from "next/navigation";
import { ownerDeleteRib, type OwnerRibFile } from "@/lib/inventaire/ownerActions";

/** Liste des RIB déjà envoyés (avec suppression immédiate) + champ pour en
 * joindre un nouveau. Le nouveau fichier n'est envoyé qu'à la validation du
 * formulaire principal (bouton "Enregistrer mes informations") — ce n'est
 * pas un envoi séparé. */
export function OwnerRibUpload({
  propertyId,
  existingFiles,
  fileInputRef,
}: {
  propertyId: string;
  existingFiles: OwnerRibFile[];
  fileInputRef: RefObject<HTMLInputElement | null>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(file: OwnerRibFile) {
    if (!window.confirm(`Supprimer « ${file.fileName} » ?`)) return;
    setError(null);
    setPendingId(file.id);
    startTransition(async () => {
      try {
        await ownerDeleteRib(propertyId, file.id);
      } catch (e) {
        unstable_rethrow(e);
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      <label className="field-label">RIB</label>
      {existingFiles.length > 0 && (
        <ul className="mt-1 space-y-1">
          {existingFiles.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-[13px] text-[#6e6e73]">
              <span className="min-w-0 truncate">📄 {f.fileName}</span>
              <button
                type="button"
                onClick={() => handleDelete(f)}
                disabled={pendingId === f.id}
                className="shrink-0 text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
                {pendingId === f.id ? "Suppression…" : "Supprimer"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={fileInputRef}
        type="file"
        name="ribFile"
        accept=".pdf,.jpg,.jpeg,.png"
        className="mt-2 text-[13px]"
      />
      <p className="mt-1 text-[12px] text-[#6e6e73]">
        Le fichier est envoyé en cliquant sur « Enregistrer mes informations » ci-dessous.
      </p>
      {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
