"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { deletePropertyElement, updatePropertyElement } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";

export function ElementCard({
  propertyId,
  element,
  attachments,
}: {
  propertyId: string;
  element: PropertyElement;
  attachments: Attachment[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <ActionForm autoSave action={(formData) => updatePropertyElement(propertyId, element.id, formData)}>
        {({ pending, error, success }) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <input
                name="name"
                defaultValue={element.name}
                required
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <ConfirmDeleteButton
                confirmText={`Supprimer « ${element.name} » ?`}
                action={() => deletePropertyElement(propertyId, element.id)}
              />
            </div>
            <textarea
              name="notes"
              defaultValue={element.notes ?? ""}
              placeholder="Note (emplacement, détails…)"
              rows={2}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <div className="mt-1 flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
      <div className="mt-2 space-y-2">
        <AttachmentGallery propertyId={propertyId} attachments={attachments} emptyLabel="Aucune photo/fichier" />
        <FileUploadButtons
          accept="image/*,.pdf,.doc,.docx"
          target={{
            propertyId,
            entityType: "property_element",
            entityId: element.id,
            kind: "element_photo",
          }}
        />
      </div>
    </div>
  );
}
