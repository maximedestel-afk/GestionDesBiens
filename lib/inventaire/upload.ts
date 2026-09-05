import { createClient } from "@/lib/supabase/client";
import { recordAttachment } from "./actions";
import type { AttachmentEntityType, AttachmentKind } from "./types";

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]/g, "_")
    .slice(-120);
}

async function compressIfImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const imageCompression = (await import("browser-image-compression")).default;
    return await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.75,
    });
  } catch {
    // La compression est un confort ; en cas d'échec on envoie l'original.
    return file;
  }
}

export interface UploadTarget {
  propertyId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  kind: AttachmentKind;
}

export async function uploadAttachment(file: File, target: UploadTarget): Promise<void> {
  const prepared = await compressIfImage(file);
  const supabase = createClient();

  const path = `${target.propertyId}/${target.entityType}/${target.entityId}/${target.kind}/${Date.now()}-${sanitizeFileName(
    prepared.name || file.name
  )}`;

  const { error } = await supabase.storage.from("property-files").upload(path, prepared, {
    contentType: prepared.type || file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(`Échec de l'envoi du fichier : ${error.message}`);

  await recordAttachment({
    propertyId: target.propertyId,
    entityType: target.entityType,
    entityId: target.entityId,
    kind: target.kind,
    filePath: path,
    fileName: file.name,
    mimeType: prepared.type || file.type || null,
    sizeBytes: prepared.size,
  });
}
