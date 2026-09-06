"use client";

import { useState } from "react";
import type { Attachment, Equipment, Room } from "@/lib/inventaire/types";
import { deleteEquipment, updateEquipment } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { EquipmentFields } from "./EquipmentFields";

export function EquipmentCard({
  propertyId,
  equipment,
  rooms,
  attachments,
}: {
  propertyId: string;
  equipment: Equipment;
  rooms: Room[];
  attachments: Attachment[];
}) {
  const [editing, setEditing] = useState(false);
  const photos = attachments.filter((a) => a.entityId === equipment.id && a.kind === "equipment_photo");
  const referencePhotos = attachments.filter(
    (a) => a.entityId === equipment.id && a.kind === "equipment_reference_photo"
  );

  if (editing) {
    return (
      <div className="card p-5">
        <ActionForm
          action={async (formData) => {
            await updateEquipment(propertyId, equipment.id, formData);
            setEditing(false);
          }}
        >
          {({ pending, error }) => (
            <>
              <EquipmentFields rooms={rooms} equipment={equipment} />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary btn-sm"
                >
                  {pending ? "…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary btn-sm"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </ActionForm>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[#1d1d1f]">{equipment.name}</p>
          <p className="text-sm text-[#6e6e73]">
            {[equipment.brand, equipment.model].filter(Boolean).join(" — ") || "—"}
          </p>
          {equipment.warranty && <p className="text-sm text-[#6e6e73]">Garantie : {equipment.warranty}</p>}
          {equipment.serialNumber && (
            <p className="text-sm text-[#6e6e73]">N° de série : {equipment.serialNumber}</p>
          )}
          {equipment.dryingFunction && (
            <span className="mt-1 inline-block rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
              Fonction séchante
            </span>
          )}
          {equipment.videoLink && (
            <p className="mt-1 text-sm">
              <a href={equipment.videoLink} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                Lien vidéo (technique)
              </a>
            </p>
          )}
          {equipment.notes && <p className="mt-1 text-sm text-[#6e6e73]">{equipment.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <button type="button" onClick={() => setEditing(true)} className="text-[#6e6e73] hover:text-[#1d1d1f]">
            Détails
          </button>
          <ConfirmDeleteButton
            confirmText={`Supprimer l'équipement « ${equipment.name} » ?`}
            action={() => deleteEquipment(propertyId, equipment.id)}
          />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[12px] font-medium text-[#6e6e73]">Photos (équipement, plaque signalétique…)</p>
        <div className="mt-1 space-y-2">
          <AttachmentGallery
            propertyId={propertyId}
            attachments={[...photos, ...referencePhotos]}
            emptyLabel="Aucune photo"
          />
          <FileUploadButtons
            target={{
              propertyId,
              entityType: "equipment",
              entityId: equipment.id,
              kind: "equipment_photo",
            }}
          />
        </div>
      </div>
    </div>
  );
}
