"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAttachment, type UploadTarget } from "@/lib/inventaire/upload";

export function FileUploadButtons({
  target,
  accept = "image/*",
  showCamera = true,
  label,
}: {
  target: UploadTarget;
  accept?: string;
  showCamera?: boolean;
  label?: string;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isVideo = accept.startsWith("video/");

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        for (const file of Array.from(files)) {
          await uploadAttachment(file, target);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-[13px] text-[#6e6e73]">{label}</span>}
      {showCamera && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => cameraInputRef.current?.click()}
            className="btn-secondary btn-sm"
          >
            {isVideo ? "🎥 Filmer" : "📷 Prendre une photo"}
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept={accept}
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => galleryInputRef.current?.click()}
        className="btn-secondary btn-sm"
      >
        🖼 Choisir des fichiers
      </button>
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {pending && <span className="text-[13px] text-[#6e6e73]">Envoi…</span>}
      {error && <span className="text-[13px] text-red-600">{error}</span>}
    </div>
  );
}
