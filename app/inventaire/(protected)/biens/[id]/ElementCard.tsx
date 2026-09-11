"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { deletePropertyElement, updatePropertyElement } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { NoteField } from "@/components/inventaire/NoteField";

export function ElementCard({
  propertyId,
  element,
  attachments,
  accept = "image/*,.pdf,.doc,.docx",
  showCamera = true,
  galleryVariant = "grid",
  showMissingBadge = false,
}: {
  propertyId: string;
  element: PropertyElement;
  attachments: Attachment[];
  accept?: string;
  showCamera?: boolean;
  galleryVariant?: "grid" | "list";
  showMissingBadge?: boolean;
}) {
  const isEmpty = !element.notes && attachments.length === 0;

  return (
    <div id={showMissingBadge ? `missing-check-water-elec-${element.id}` : undefined} className="card p-5">
      <ActionForm autoSave action={(formData) => updatePropertyElement(propertyId, element.id, formData)}>
        {({ pending, error, success }) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <input
                  name="name"
                  defaultValue={element.name}
                  required
                  className="w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] font-medium text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                />
                {showMissingBadge && isEmpty && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    ⚠️ Données manquantes
                  </span>
                )}
              </div>
              <ConfirmDeleteButton
                confirmText={`Supprimer « ${element.name} » ?`}
                action={() => deletePropertyElement(propertyId, element.id)}
              />
            </div>
            <div className="mt-2">
              <NoteField name="notes" defaultValue={element.notes} placeholder="Note (emplacement, détails…)" />
            </div>
            <div className="mt-1 flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
      <div className="mt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <AttachmentGallery
            propertyId={propertyId}
            attachments={attachments}
            emptyLabel="Aucune photo/fichier"
            variant={galleryVariant}
            scrollable={galleryVariant === "grid"}
          />
        </div>
        <div className="shrink-0">
          <FileUploadButtons
            accept={accept}
            showCamera={showCamera}
            target={{
              propertyId,
              entityType: "property_element",
              entityId: element.id,
              kind: "element_photo",
            }}
          />
        </div>
      </div>
    </div>
  );
}
