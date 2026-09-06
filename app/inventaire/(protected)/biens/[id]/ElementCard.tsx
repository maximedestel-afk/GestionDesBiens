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
    <div className="card p-5">
      <ActionForm autoSave action={(formData) => updatePropertyElement(propertyId, element.id, formData)}>
        {({ pending, error, success }) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <input
                name="name"
                defaultValue={element.name}
                required
                className="flex-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] font-medium text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
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
              className="mt-2 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
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
