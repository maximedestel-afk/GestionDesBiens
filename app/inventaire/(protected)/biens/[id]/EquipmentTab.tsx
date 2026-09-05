"use client";

import { useState } from "react";
import type { Attachment, Equipment, Room } from "@/lib/inventaire/types";
import { createEquipment, loadStandardEquipment } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { EquipmentFields } from "./EquipmentFields";
import { EquipmentCard } from "./EquipmentCard";

function StandardEquipmentLoader({ propertyId, rooms }: { propertyId: string; rooms: Room[] }) {
  const [roomId, setRoomId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-3.5">
      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
      >
        <option value="">Choisir une pièce…</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!roomId || pending}
        onClick={() => {
          setError(null);
          setPending(true);
          loadStandardEquipment(propertyId, roomId)
            .catch((e) => setError(e instanceof Error ? e.message : "Erreur."))
            .finally(() => setPending(false));
        }}
        className="btn-primary"
      >
        {pending ? "Chargement…" : "Charger les équipements standards"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

function AddEquipmentForm({ propertyId, rooms, defaultRoomId }: { propertyId: string; rooms: Room[]; defaultRoomId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
      >
        + Ajouter un équipement
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-black/15 p-4">
      <ActionForm
        resetOnSuccess
        action={async (formData) => {
          await createEquipment(propertyId, formData);
          setOpen(false);
        }}
      >
        {({ pending, error }) => (
          <>
            <EquipmentFields rooms={rooms} defaultRoomId={defaultRoomId} />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="btn-primary btn-sm"
              >
                {pending ? "…" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
    <div className="space-y-6">
      <StandardEquipmentLoader propertyId={propertyId} rooms={rooms} />

      {rooms.map((room) => {
        const roomEquipment = equipment.filter((e) => e.roomId === room.id);
        return (
          <section key={room.id}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">{room.name}</h2>
              <AddEquipmentForm propertyId={propertyId} rooms={rooms} defaultRoomId={room.id} />
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
    </div>
  );
}
