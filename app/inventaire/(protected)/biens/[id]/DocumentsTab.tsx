"use client";

import type { Attachment, PropertyElement, PropertyOwner } from "@/lib/inventaire/types";
import { savePropertyOwner } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";
import { DocumentField } from "./OwnerTab";

export function DocumentsTab({
  propertyId,
  owner,
  leaseAttachments,
  rcpAttachments,
  documents,
  attachments,
  missingCheckKeys,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  leaseAttachments: Attachment[];
  rcpAttachments: Attachment[];
  documents: PropertyElement[];
  attachments: Attachment[];
  missingCheckKeys: string[];
}) {
  return (
    <div className="space-y-4">
      <ActionForm className="space-y-4" autoSave action={(formData) => savePropertyOwner(propertyId, formData)}>
        {({ pending, error, success }) => (
          <>
            <DocumentField
              propertyId={propertyId}
              title="Bail"
              attachments={leaseAttachments}
              emptyLabel="Aucun bail joint"
              kind="lease_contract"
              noteName="leaseNotes"
              noteValue={owner?.leaseNotes}
              noteCsvKey="leaseNotes"
              checkKey="lease_contract"
              missing={missingCheckKeys.includes("lease_contract")}
            />
            <DocumentField
              propertyId={propertyId}
              title="RCP"
              attachments={rcpAttachments}
              emptyLabel="Aucune RCP jointe"
              kind="rcp"
              noteName="rcpNotes"
              noteValue={owner?.rcpNotes}
              noteCsvKey="rcpNotes"
              checkKey="rcp"
              missing={missingCheckKeys.includes("rcp")}
            />
            <div className="flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>

      <p className="text-sm text-[#6e6e73]">
        Rangez ici tous les autres documents du bien (règlement de copropriété, attestation d&apos;assurance…) :
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
