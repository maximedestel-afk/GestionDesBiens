"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

export function DocumentsTab({
  propertyId,
  documents,
  attachments,
}: {
  propertyId: string;
  documents: PropertyElement[];
  attachments: Attachment[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6e6e73]">
        Rangez ici tous les documents du bien (règlement de copropriété, attestation d&apos;assurance…) :
        donnez un titre, une note, et joignez le(s) fichier(s).
      </p>
      <AddElementForm propertyId={propertyId} section="documents" label="+ Ajouter un document" />
      <div className="space-y-3">
        {documents.map((doc) => (
          <ElementCard
            key={doc.id}
            propertyId={propertyId}
            element={doc}
            attachments={attachments.filter((a) => a.entityId === doc.id)}
            accept=".pdf,.doc,.docx,image/*"
            showCamera={false}
            galleryVariant="list"
          />
        ))}
      </div>
    </div>
  );
}
