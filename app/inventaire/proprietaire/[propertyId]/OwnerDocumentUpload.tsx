"use client";

import { useState, useTransition, type RefObject } from "react";
import Image from "next/image";
import { unstable_rethrow } from "next/navigation";
import type { OwnerDocumentFile } from "@/lib/inventaire/ownerActions";

function isImage(mimeType: string | null) {
  return !!mimeType && mimeType.startsWith("image/");
}

/** Liste des documents (RIB, RCP…) déjà envoyés pour ce bien (avec
 * suppression immédiate) + champ pour en joindre un nouveau. Le nouveau
 * fichier n'est envoyé qu'à la validation du formulaire principal (bouton
 * "Enregistrer mes informations") — ce n'est pas un envoi séparé. */
export function OwnerDocumentUpload({
  propertyId,
  label,
  fieldName,
  existingFiles,
  fileInputRef,
  deleteAction,
}: {
  propertyId: string;
  label: string;
  fieldName: string;
  existingFiles: OwnerDocumentFile[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  deleteAction: (propertyId: string, attachmentId: string) => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(file: OwnerDocumentFile) {
    if (!window.confirm(`Supprimer « ${file.fileName} » ?`)) return;
    setError(null);
    setPendingId(file.id);
    startTransition(async () => {
      try {
        await deleteAction(propertyId, file.id);
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
      <label className="field-label">{label}</label>
      {existingFiles.length > 0 && (
        <ul className="mt-1 space-y-2">
          {existingFiles.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-[13px] text-[#6e6e73]">
              <a
                href={f.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 hover:underline"
              >
                {isImage(f.mimeType) && f.url ? (
                  <Image
                    src={f.url}
                    alt={f.fileName}
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="shrink-0">📄</span>
                )}
                <span className="min-w-0 truncate">{f.fileName}</span>
              </a>
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
        name={fieldName}
        accept=".pdf,.jpg,.jpeg,.png"
        className="mt-2 block w-full cursor-pointer text-[13px] text-[#6e6e73] file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#0071e3] file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-white file:transition hover:file:bg-[#0077ed]"
      />
      <p className="mt-1 text-[12px] text-[#6e6e73]">
        Le fichier est envoyé en cliquant sur « Enregistrer mes informations » ci-dessous.
      </p>
      {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
