"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAttachment, type UploadTarget } from "@/lib/inventaire/upload";

export function FileUploadButtons({
  target,
  accept = "image/*",
  showCamera = true,
  showVideoCamera = false,
  label,
}: {
  target: UploadTarget;
  accept?: string;
  showCamera?: boolean;
  /** Bouton "Filmer" distinct, pour les zones acceptant à la fois photo et vidéo. */
  showVideoCamera?: boolean;
  label?: string;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
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
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-wrap items-center gap-2 rounded-[10px] border-2 border-dashed p-2 transition ${
        dragActive ? "border-[#0071e3] bg-[#0071e3]/5" : "border-transparent"
      }`}
    >
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
      {showVideoCamera && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => videoCameraInputRef.current?.click()}
            className="btn-secondary btn-sm"
          >
            🎥 Filmer
          </button>
          <input
            ref={videoCameraInputRef}
            type="file"
            accept="video/*"
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
      <span className="text-[13px] text-black/35">ou glissez-déposez ici</span>
      {pending && <span className="text-[13px] text-[#6e6e73]">Envoi…</span>}
      {error && <span className="text-[13px] text-red-600">{error}</span>}
    </div>
  );
}
