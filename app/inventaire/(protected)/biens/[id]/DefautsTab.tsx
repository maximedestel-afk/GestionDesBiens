"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

export function DefautsTab({
  propertyId,
  elements,
  attachments,
}: {
  propertyId: string;
  elements: PropertyElement[];
  attachments: Attachment[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6e6e73]">
        Listez les défauts de l&apos;appartement : ajoutez un élément avec une photo ou une vidéo et une
        note.
      </p>
      <AddElementForm propertyId={propertyId} section="defauts" label="+ Ajouter un défaut" />
      <div className="space-y-3">
        {elements.map((el) => (
          <ElementCard
            key={el.id}
            propertyId={propertyId}
            element={el}
            attachments={attachments.filter((a) => a.entityId === el.id)}
            accept="image/*,video/*"
            showVideoCamera
          />
        ))}
      </div>
    </div>
  );
}
