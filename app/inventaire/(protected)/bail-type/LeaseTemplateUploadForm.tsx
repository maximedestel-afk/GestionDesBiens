"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordLeaseTemplateUpload } from "@/lib/inventaire/actions";

const TEMPLATE_STORAGE_PATH = "system/lease-template.docx";

export function LeaseTemplateUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("property-files")
          .upload(TEMPLATE_STORAGE_PATH, file, {
            contentType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            upsert: true,
          });
        if (uploadError) throw new Error(`Échec de l'envoi : ${uploadError.message}`);

        await recordLeaseTemplateUpload({ filePath: TEMPLATE_STORAGE_PATH, originalFilename: file.name });
        setSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
      }
    });
  }

  return (
    <div className="card space-y-2 p-5">
      <h2 className="text-sm font-semibold text-[#1d1d1f]">Remplacer le modèle</h2>
      <p className="text-[13px] text-[#6e6e73]">
        Fichier Word (.docx) avec les balises entre crochets (ex. [nom_bailleur]) déjà reprises par la
        génération automatique.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="btn-primary btn-sm"
        >
          {pending ? "Envoi…" : "Choisir un fichier .docx"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {success && <span className="text-[13px] text-emerald-600">Modèle mis à jour.</span>}
        {error && <span className="text-[13px] text-red-600">{error}</span>}
      </div>
    </div>
  );
}
