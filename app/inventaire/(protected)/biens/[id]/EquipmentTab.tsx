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
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        + Ajouter un équipement
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-4">
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
                className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {pending ? "…" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
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
              <h2 className="text-sm font-semibold text-slate-900">{room.name}</h2>
              <AddEquipmentForm propertyId={propertyId} rooms={rooms} defaultRoomId={room.id} />
            </div>
            {roomEquipment.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun équipement dans cette pièce.</p>
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
