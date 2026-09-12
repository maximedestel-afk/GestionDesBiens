"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Attachment } from "@/lib/inventaire/types";

/** Visionneuse plein écran pour parcourir toutes les photos d'une même
 * galerie (flèches, clavier ← → Échap, indicateur "n / total"). */
export function AttachmentLightbox({
  attachments,
  index,
  onClose,
  onNavigate,
}: {
  attachments: Attachment[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const attachment = attachments[index];
  const count = attachments.length;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onNavigate((index - 1 + count) % count);
      else if (e.key === "ArrowRight") onNavigate((index + 1) % count);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, count, onClose, onNavigate]);

  if (!attachment?.url) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Fermer"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
      >
        ✕
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + count) % count);
            }}
            aria-label="Photo précédente"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-4"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % count);
            }}
            aria-label="Photo suivante"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-4"
          >
            ›
          </button>
        </>
      )}

      <div
        className="relative h-[80vh] w-[88vw] sm:w-[80vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={attachment.url}
          alt={attachment.fileName}
          fill
          unoptimized
          className="object-contain"
        />
      </div>

      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[13px] text-white">
          {index + 1} / {count}
        </div>
      )}
    </div>
  );
}
