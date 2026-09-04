"use client";

import { useState } from "react";
import type { Equipment, Room } from "@/lib/inventaire/types";

export function EquipmentFields({
  rooms,
  defaultRoomId,
  equipment,
}: {
  rooms: Room[];
  defaultRoomId?: string;
  equipment?: Equipment;
}) {
  const [name, setName] = useState(equipment?.name ?? "");
  const showDryingFunction = name.toLowerCase().includes("lave-linge");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-xs font-medium text-slate-500">Nom *</label>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Pièce *</label>
        <select
          name="roomId"
          required
          defaultValue={equipment?.roomId ?? defaultRoomId ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="" disabled>
            Choisir une pièce…
          </option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Marque</label>
        <input
          name="brand"
          defaultValue={equipment?.brand ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Garantie</label>
        <input
          name="warranty"
          defaultValue={equipment?.warranty ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Modèle (facultatif)</label>
        <input
          name="model"
          defaultValue={equipment?.model ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Numéro de série (facultatif)</label>
        <input
          name="serialNumber"
          defaultValue={equipment?.serialNumber ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      {showDryingFunction && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="dryingFunction"
            value="true"
            defaultChecked={equipment?.dryingFunction ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Fonction séchante
        </label>
      )}
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-500">Lien vidéo (ex. reset instructions)</label>
        <input
          name="videoLink"
          type="url"
          defaultValue={equipment?.videoLink ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-500">Notes</label>
        <textarea
          name="notes"
          defaultValue={equipment?.notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
