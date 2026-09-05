"use client";

import { useRef, useState } from "react";
import type { Attachment, Equipment, Room } from "@/lib/inventaire/types";
import { createEquipment, loadStandardEquipment } from "@/lib/inventaire/actions";
import { detectRoomType } from "@/lib/inventaire/catalog";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { EquipmentFields } from "./EquipmentFields";
import { EquipmentCard } from "./EquipmentCard";

function LoadRoomStandardsButton({ propertyId, room }: { propertyId: string; room: Room }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!detectRoomType(room.name)) return null;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          setPending(true);
          loadStandardEquipment(propertyId, room.id)
            .catch((e) => setError(e instanceof Error ? e.message : "Erreur."))
            .finally(() => setPending(false));
        }}
        className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
      >
        {pending ? "Chargement…" : "Charger les standards"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}

function AddEquipmentFab({ propertyId, rooms }: { propertyId: string; rooms: Room[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0071e3] text-2xl font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:bg-[#0077ed] active:scale-95"
        aria-label="Ajouter un équipement"
      >
        +
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-[28rem] max-w-[90vw] rounded-xl p-0 backdrop:bg-black/40"
      >
        {open && (
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Ajouter un équipement</h3>
            <ActionForm
              className="mt-3"
              resetOnSuccess
              action={async (formData) => {
                await createEquipment(propertyId, formData);
                dialogRef.current?.close();
              }}
            >
              {({ pending, error }) => (
                <>
                  <EquipmentFields rooms={rooms} />
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => dialogRef.current?.close()}
                      className="btn-secondary btn-sm"
                    >
                      Annuler
                    </button>
                    <button type="submit" disabled={pending} className="btn-primary">
                      {pending ? "…" : "Ajouter"}
                    </button>
                  </div>
                </>
              )}
            </ActionForm>
          </div>
        )}
      </dialog>
    </>
  );
}

export function EquipmentTab({
  propertyId,
  rooms,
  equipment,
  attachments,
}: {
  propertyId: string;
  rooms: Room[];
  equipment: Equipment[];
  attachments: Attachment[];
}) {
  if (rooms.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-6 text-[15px] text-[#6e6e73]">
        Aucune pièce définie. Renseignez d&apos;abord les pièces dans l&apos;onglet Agencement pour pouvoir y
        assigner des équipements.
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {rooms.map((room) => {
        const roomEquipment = equipment.filter((e) => e.roomId === room.id);
        return (
          <section key={room.id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">{room.name}</h2>
              <LoadRoomStandardsButton propertyId={propertyId} room={room} />
            </div>
            {roomEquipment.length === 0 ? (
              <p className="text-sm text-black/35">Aucun équipement dans cette pièce.</p>
            ) : (
              <div className="space-y-3">
                {roomEquipment.map((item) => (
                  <EquipmentCard
                    key={item.id}
                    propertyId={propertyId}
                    equipment={item}
                    rooms={rooms}
                    attachments={attachments}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <AddEquipmentFab propertyId={propertyId} rooms={rooms} />
    </div>
  );
}
