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

export function AttachmentGallery({
  propertyId,
  attachments,
  emptyLabel = "Aucun fichier",
}: {
  propertyId: string;
  attachments: Attachment[];
  emptyLabel?: string;
}) {
  if (attachments.length === 0) {
    return <p className="text-[13px] text-black/35">{emptyLabel}</p>;
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
              <video src={attachment.url} className="h-28 w-28 object-cover" muted />
            ) : (
              <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-[#6e6e73]">
                <span className="text-2xl">📄</span>
                <span className="line-clamp-2 break-all">{attachment.fileName}</span>
              </div>
            )}
          </a>
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
