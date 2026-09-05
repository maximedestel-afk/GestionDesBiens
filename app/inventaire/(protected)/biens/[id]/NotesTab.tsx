"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

export function NotesTab({
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
      <p className="text-sm text-slate-500">
        Pour tout ce qui ne rentre pas dans une autre case : ajoutez un élément avec une photo/fichier et une
        note.
      </p>
      <div className="space-y-3">
        {elements.map((el) => (
          <ElementCard
            key={el.id}
            propertyId={propertyId}
            element={el}
            attachments={attachments.filter((a) => a.entityId === el.id)}
          />
        ))}
      </div>
      <AddElementForm propertyId={propertyId} section="notes" />
    </div>
  );
}
