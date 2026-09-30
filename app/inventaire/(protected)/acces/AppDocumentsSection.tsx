"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAppDocument, deleteAppDocument, updateAppDocumentNotes } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { NoteField } from "@/components/inventaire/NoteField";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import type { AppDocument } from "@/lib/inventaire/types";

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]/g, "_")
    .slice(-120);
}

function AddAppDocumentForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Donnez d'abord un titre au document.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const path = `app-documents/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("property-files").upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (uploadError) throw new Error(`Échec de l'envoi : ${uploadError.message}`);

        await createAppDocument({
          title: trimmedTitle,
          notes: notes.trim() || null,
          filePath: path,
          originalFilename: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size,
        });
        setTitle("");
        setNotes("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
      }
    });
  }

  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-sm font-semibold text-[#1d1d1f]">Ajouter un document</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="field-label" htmlFor="new-app-document-title">
            Titre
          </label>
          <input
            id="new-app-document-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. Utilisation de VRPlatform"
            className="field-input"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="btn-primary btn-sm"
        >
          {pending ? "Envoi…" : "Choisir un fichier"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="new-app-document-notes">
          Note (optionnel)
        </label>
        <textarea
          id="new-app-document-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Précisions d'utilisation…"
          rows={2}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </div>
  );
}

export function AppDocumentsSection({ documents }: { documents: AppDocument[] }) {
  return (
    <div className="space-y-4">
      <AddAppDocumentForm />
      {documents.length > 0 && (
        <ul className="card divide-y divide-black/[0.06]">
          {documents.map((doc) => (
            <li key={doc.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#1d1d1f]">{doc.title}</p>
                  <p className="truncate text-[13px] text-[#6e6e73]">{doc.originalFilename}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {doc.downloadUrl && (
                    <a href={doc.downloadUrl} target="_blank" rel="noreferrer" className="link-quiet text-[13px]">
                      Télécharger
                    </a>
                  )}
                  <ConfirmDeleteButton
                    label="Supprimer"
                    confirmText={`Supprimer « ${doc.title} » ? Cette action est irréversible.`}
                    action={() => deleteAppDocument(doc.id)}
                  />
                </div>
              </div>
              <ActionForm className="mt-2" autoSave action={(formData) => updateAppDocumentNotes(doc.id, formData)}>
                {({ pending, error, success }) => (
                  <>
                    <NoteField name="notes" defaultValue={doc.notes} placeholder="Précisions d'utilisation…" />
                    <div className="mt-1 flex justify-end">
                      <SaveStatus pending={pending} error={error} success={success} />
                    </div>
                  </>
                )}
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
