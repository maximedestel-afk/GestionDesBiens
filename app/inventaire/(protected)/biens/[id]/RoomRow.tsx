"use client";

import { useState } from "react";
import type { Room } from "@/lib/inventaire/types";
import { deleteRoom, updateRoom } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";

export function RoomRow({ propertyId, room }: { propertyId: string; room: Room }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-md border border-slate-200 p-3">
        <ActionForm
          action={async (formData) => {
            await updateRoom(propertyId, room.id, formData);
            setEditing(false);
          }}
        >
          {({ pending, error }) => (
            <div className="space-y-2">
              <input
                name="name"
                defaultValue={room.name}
                required
                placeholder="Nom de la pièce"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <textarea
                name="description"
                defaultValue={room.description ?? ""}
                placeholder="Couchage / équipement (ex. Lit 140, Canapé-lit, Douche)"
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
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
            </div>
          )}
        </ActionForm>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
      <div>
        <p className="font-medium text-slate-900">{room.name}</p>
        {room.description && <p className="text-sm text-slate-500">{room.description}</p>}
      </div>
      <div className="flex shrink-0 gap-3 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="text-slate-600 hover:text-slate-900">
          Modifier
        </button>
        <ConfirmDeleteButton
          confirmText={`Supprimer la pièce « ${room.name} » ? Les équipements associés seront aussi supprimés.`}
          action={() => deleteRoom(propertyId, room.id)}
        />
      </div>
    </li>
  );
}
