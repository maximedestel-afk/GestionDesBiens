"use client";

import Image from "next/image";
import type { Attachment } from "@/lib/inventaire/types";
import { deleteAttachment } from "@/lib/inventaire/actions";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

function isImage(mime: string | null) {
  return !!mime && mime.startsWith("image/");
}
function isVideo(mime: string | null) {
  return !!mime && mime.startsWith("video/");
}

/** Ajoute le paramètre "download" à une URL signée Supabase : le fichier est
 * alors servi avec Content-Disposition: attachment (téléchargement forcé,
 * avec le bon nom de fichier) au lieu d'un affichage inline dans le navigateur. */
function downloadHref(url: string, fileName: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("download", fileName);
    return u.toString();
  } catch {
    return url;
  }
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
    </svg>
  );
}

export function AttachmentGallery({
  propertyId,
  attachments,
  emptyLabel = "Aucun fichier",
  variant = "grid",
}: {
  propertyId: string;
  attachments: Attachment[];
  emptyLabel?: string;
  /** "list" : lignes compactes, adapté aux documents (bail, RIB…) plutôt qu'aux photos. */
  variant?: "grid" | "list";
}) {
  if (attachments.length === 0) {
    return <p className="text-[13px] text-black/35">{emptyLabel}</p>;
  }

  if (variant === "list") {
    return (
      <ul className="divide-y divide-black/[0.06] overflow-hidden rounded-[10px] border border-black/[0.06]">
        {attachments.map((attachment) => (
          <li key={attachment.id} className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5">
            <a
              href={attachment.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2 text-[14px] text-[#1d1d1f] hover:underline"
            >
              <span>📄</span>
              <span className="truncate">{attachment.fileName}</span>
            </a>
            <div className="flex shrink-0 items-center gap-1">
              {attachment.url && (
                <a
                  href={downloadHref(attachment.url, attachment.fileName)}
                  download={attachment.fileName}
                  title="Télécharger"
                  aria-label="Télécharger"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#6e6e73] transition hover:bg-black/[0.05] hover:text-[#1d1d1f]"
                >
                  <DownloadIcon />
                </a>
              )}
              <ConfirmDeleteButton
                label="✕"
                confirmText={`Supprimer « ${attachment.fileName} » ?`}
                action={() => deleteAttachment(propertyId, attachment.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-red-600 transition hover:bg-red-50"
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group relative w-28 overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.02] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <a href={attachment.url ?? "#"} target="_blank" rel="noreferrer" className="block">
            {isImage(attachment.mimeType) && attachment.url ? (
              <Image
                src={attachment.url}
                alt={attachment.fileName}
                width={112}
                height={112}
                unoptimized
                className="h-28 w-28 object-cover"
              />
            ) : isVideo(attachment.mimeType) && attachment.url ? (
              <div className="relative h-28 w-28">
                <video src={attachment.url} className="h-28 w-28 object-cover" muted />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-[#6e6e73]">
                <span className="text-2xl">📄</span>
                <span className="line-clamp-2 break-all">{attachment.fileName}</span>
              </div>
            )}
          </a>
          {attachment.url && (
            <div className="absolute left-1.5 top-1.5 opacity-80 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <a
                href={downloadHref(attachment.url, attachment.fileName)}
                download={attachment.fileName}
                title="Télécharger"
                aria-label="Télécharger"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[#1d1d1f] shadow-sm transition hover:bg-white"
              >
                <DownloadIcon />
              </a>
            </div>
          )}
          <div className="absolute right-1.5 top-1.5 opacity-80 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <ConfirmDeleteButton
              label="✕"
              confirmText={`Supprimer « ${attachment.fileName} » ?`}
              action={() => deleteAttachment(propertyId, attachment.id)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-xs text-red-600 shadow-sm transition hover:bg-white"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
