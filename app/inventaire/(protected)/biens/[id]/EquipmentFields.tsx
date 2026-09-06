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
        <label className="block text-[12px] font-medium text-[#6e6e73]">Nom *</label>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-[#6e6e73]">Pièce *</label>
        <select
          name="roomId"
          required
          defaultValue={equipment?.roomId ?? defaultRoomId ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
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
        <label className="block text-[12px] font-medium text-[#6e6e73]">Marque</label>
        <input
          name="brand"
          defaultValue={equipment?.brand ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-[#6e6e73]">Garantie</label>
        <input
          name="warranty"
          defaultValue={equipment?.warranty ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-[#6e6e73]">Modèle (facultatif)</label>
        <input
          name="model"
          defaultValue={equipment?.model ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-[#6e6e73]">Numéro de série (facultatif)</label>
        <input
          name="serialNumber"
          defaultValue={equipment?.serialNumber ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      {showDryingFunction && (
        <label className="flex items-center gap-2 text-sm text-[#1d1d1f]">
          <input
            type="checkbox"
            name="dryingFunction"
            value="true"
            defaultChecked={equipment?.dryingFunction ?? false}
            className="h-4 w-4 rounded border-black/10"
          />
          Fonction séchante
        </label>
      )}
      <div className="sm:col-span-2">
        <label className="block text-[12px] font-medium text-[#6e6e73]">Lien vidéo (ex. reset instructions)</label>
        <input
          name="videoLink"
          type="url"
          defaultValue={equipment?.videoLink ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-[12px] font-medium text-[#6e6e73]">Note</label>
        <textarea
          name="notes"
          defaultValue={equipment?.notes ?? ""}
          rows={3}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      </div>
    </div>
  );
}
