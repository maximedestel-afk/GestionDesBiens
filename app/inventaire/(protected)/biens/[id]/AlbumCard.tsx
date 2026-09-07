"use client";

import type { Attachment, PropertyElement } from "@/lib/inventaire/types";
import { deletePropertyElement, updatePropertyElement } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";

const inputClass =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

export function AlbumCard({
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
                placeholder="Titre de l'album (ex. Photos brut 19/05)"
                className="flex-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] font-medium text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
              />
              <ConfirmDeleteButton
                confirmText={`Supprimer l'album « ${element.name} » et ses photos ?`}
                action={() => deletePropertyElement(propertyId, element.id)}
              />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">
                  Lien vers un album (ex. Google Photos)
                </label>
                <input
                  name="url"
                  type="url"
                  defaultValue={element.url ?? ""}
                  placeholder="https://…"
                  className={inputClass}
                />
                {element.url && (
                  <a
                    href={element.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[13px] text-sky-600 hover:underline"
                  >
                    Ouvrir l&apos;album
                  </a>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Note (optionnel)</label>
                <input name="notes" defaultValue={element.notes ?? ""} className={inputClass} />
              </div>
            </div>
            <div className="mt-1 flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
      <div className="mt-3 space-y-2">
        <AttachmentGallery propertyId={propertyId} attachments={attachments} emptyLabel="Aucune photo pour l'instant" />
        <FileUploadButtons
          accept="image/*"
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
