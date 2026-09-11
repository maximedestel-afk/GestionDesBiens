"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { AlbumCard } from "./AlbumCard";
import { AddElementForm } from "./AddElementForm";

export function PhotosTab({
  propertyId,
  albums,
  attachments,
}: {
  propertyId: string;
  albums: PropertyElement[];
  attachments: Attachment[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6e6e73]">
        Créez un album par lot (ex. « Photos brut 19/05 », « Photos IA »), puis prenez des photos, joignez des
        fichiers (photos, documents…) ou ajoutez un lien vers un album externe (ex. Google Photos).
      </p>
      <AddElementForm propertyId={propertyId} section="photos" label="+ Ajouter un album" />
      <div className="space-y-3">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            propertyId={propertyId}
            element={album}
            attachments={attachments.filter((a) => a.entityId === album.id)}
          />
        ))}
      </div>
    </div>
  );
}
