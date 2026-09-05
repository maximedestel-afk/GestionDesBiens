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
      <li className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
                className="w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
              />
              <textarea
                name="description"
                defaultValue={room.description ?? ""}
                placeholder="Couchage / équipement (ex. Lit 140, Canapé-lit, Douche)"
                rows={2}
                className="w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
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
            </div>
          )}
        </ActionForm>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div>
        <p className="font-medium text-[#1d1d1f]">{room.name}</p>
        {room.description && <p className="text-sm text-[#6e6e73]">{room.description}</p>}
      </div>
      <div className="flex shrink-0 gap-3 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="text-[#6e6e73] hover:text-[#1d1d1f]">
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
