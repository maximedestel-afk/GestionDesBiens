"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { Attachment, Equipment, Room } from "@/lib/inventaire/types";
import { deleteEquipment, updateEquipment, updateEquipmentDetails } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { EquipmentFields } from "./EquipmentFields";

function DetailsButton({
  propertyId,
  equipment,
}: {
  propertyId: string;
  equipment: Equipment;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-slate-600 hover:text-slate-900"
      >
        Détails
      </button>
      <dialog ref={dialogRef} className="w-96 max-w-[90vw] rounded-xl p-0 backdrop:bg-black/40">
        <form
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const details = new FormData(e.currentTarget).get("details");
            setError(null);
            startTransition(async () => {
              try {
                await updateEquipmentDetails(propertyId, equipment.id, String(details ?? ""));
                dialogRef.current?.close();
              } catch (err) {
                unstable_rethrow(err);
                setError(err instanceof Error ? err.message : "Une erreur est survenue.");
              }
            });
          }}
        >
          <h3 className="text-sm font-semibold text-slate-900">Détails — {equipment.name}</h3>
          <textarea
            name="details"
            defaultValue={equipment.notes ?? ""}
            rows={5}
            autoFocus
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

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
      <div className="rounded-lg border border-slate-200 bg-white p-4">
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
                  className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {pending ? "…" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{equipment.name}</p>
          <p className="text-sm text-slate-500">
            {[equipment.brand, equipment.model].filter(Boolean).join(" — ") || "—"}
          </p>
          {equipment.warranty && <p className="text-sm text-slate-500">Garantie : {equipment.warranty}</p>}
          {equipment.serialNumber && (
            <p className="text-sm text-slate-500">N° de série : {equipment.serialNumber}</p>
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
          {equipment.notes && <p className="mt-1 text-sm text-slate-500">{equipment.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <DetailsButton propertyId={propertyId} equipment={equipment} />
          <button type="button" onClick={() => setEditing(true)} className="text-slate-600 hover:text-slate-900">
            Modifier
          </button>
          <ConfirmDeleteButton
            confirmText={`Supprimer l'équipement « ${equipment.name} » ?`}
            action={() => deleteEquipment(propertyId, equipment.id)}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-500">Photo de l&apos;équipement</p>
          <div className="mt-1 space-y-2">
            <AttachmentGallery propertyId={propertyId} attachments={photos} emptyLabel="Aucune photo" />
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
        <div>
          <p className="text-xs font-medium text-slate-500">Photo de la référence (plaque signalétique)</p>
          <div className="mt-1 space-y-2">
            <AttachmentGallery
              propertyId={propertyId}
              attachments={referencePhotos}
              emptyLabel="Aucune photo"
            />
            <FileUploadButtons
              target={{
                propertyId,
                entityType: "equipment",
                entityId: equipment.id,
                kind: "equipment_reference_photo",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
