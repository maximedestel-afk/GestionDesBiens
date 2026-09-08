"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAttachment, type UploadTarget } from "@/lib/inventaire/upload";

function PaperclipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 015 5l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" />
    </svg>
  );
}

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
            className="btn-primary btn-sm"
          >
            {isVideo ? "Film" : "Photo"}
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
            className="btn-primary btn-sm"
          >
            Film
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
        title="Joindre un fichier"
        aria-label="Joindre un fichier"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3] text-white
          transition hover:bg-[#0077ed] active:bg-[#0068d1] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PaperclipIcon />
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
