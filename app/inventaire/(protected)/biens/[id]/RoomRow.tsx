"use client";

import { useRef, useState, useTransition } from "react";
import type { BedType, Room, RoomBed } from "@/lib/inventaire/types";
import { createRoomBed, deleteRoom, deleteRoomBed, updateRoom, updateRoomBed } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { useOutsideClick } from "@/components/inventaire/useOutsideClick";
import { useUserRole } from "@/components/inventaire/UserRoleContext";

const BED_LABELS: Record<BedType, string> = {
  double: "Double",
  queen: "Queen",
  king: "King",
  sofa_bed: "Canapé-lit",
  lit_bebe: "Lit bébé",
  autre: "Autre",
};

function BedChip({ propertyId, bed }: { propertyId: string; bed: RoomBed }) {
  const [detail, setDetail] = useState(bed.bedTypeDetail ?? "");
  const role = useUserRole();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.03] py-1 pl-3 pr-1.5 text-[13px] text-[#1d1d1f]">
      🛏️
      {bed.bedType === "autre" ? (
        <ActionForm autoSave action={(formData) => updateRoomBed(propertyId, bed.id, formData)}>
          {() => (
            <input
              name="bedTypeDetail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Préciser…"
              className="w-24 rounded border border-transparent bg-transparent px-1 text-[13px] text-[#1d1d1f] focus:border-black/10 focus:bg-white focus:outline-none"
            />
          )}
        </ActionForm>
      ) : (
        BED_LABELS[bed.bedType]
      )}
      {role !== "menage" && (
        <button
          type="button"
          onClick={() => {
            deleteRoomBed(propertyId, bed.id).catch(() => {});
          }}
          aria-label="Supprimer ce lit"
          className="text-black/30 hover:text-red-600"
        >
          ×
        </button>
      )}
    </span>
  );
}

function AddBedMenu({ propertyId, roomId }: { propertyId: string; roomId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  const add = (bedType: BedType) => {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      try {
        await createRoomBed(propertyId, roomId, bedType);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur.");
      }
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border-2 border-[#0071e3] px-3 py-1 text-[13px] font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/10 disabled:opacity-50"
      >
        + Ajouter un lit
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 w-40 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          {(["double", "queen", "king", "sofa_bed", "lit_bebe", "autre"] as BedType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="block w-full px-3.5 py-2 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
            >
              {BED_LABELS[type]}
            </button>
          ))}
        </div>
      )}
      {error && <p className="absolute left-0 mt-1 w-40 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function RoomRow({
  propertyId,
  room,
  beds,
}: {
  propertyId: string;
  room: Room;
  beds: RoomBed[];
}) {
  const [renaming, setRenaming] = useState(false);

  return (
    <li className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {renaming ? (
        <ActionForm
          action={async (formData) => {
            formData.set("description", room.description ?? "");
            await updateRoom(propertyId, room.id, formData);
            setRenaming(false);
          }}
        >
          {({ pending, error }) => (
            <div className="flex flex-wrap items-center gap-2">
              <input
                name="name"
                defaultValue={room.name}
                required
                autoFocus
                placeholder="Nom de la pièce"
                className="min-w-[10rem] flex-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
              />
              <button type="submit" disabled={pending} className="btn-primary btn-sm">
                {pending ? "…" : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setRenaming(false)} className="btn-secondary btn-sm">
                Annuler
              </button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          )}
        </ActionForm>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-[#1d1d1f]">
            {beds.length > 0 && <span className="mr-1.5">🛏️</span>}
            {room.name}
          </p>
          <div className="flex shrink-0 gap-3 text-sm">
            <button type="button" onClick={() => setRenaming(true)} className="text-[#6e6e73] hover:text-[#1d1d1f]">
              Modifier
            </button>
            <ConfirmDeleteButton
              confirmText={`Supprimer la pièce « ${room.name} » ? Les équipements associés seront aussi supprimés.`}
              action={() => deleteRoom(propertyId, room.id)}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {beds.map((bed) => (
          <BedChip key={bed.id} propertyId={propertyId} bed={bed} />
        ))}
        <AddBedMenu propertyId={propertyId} roomId={room.id} />
      </div>

      <ActionForm
        className="mt-3"
        autoSave
        action={(formData) => {
          formData.set("name", room.name);
          return updateRoom(propertyId, room.id, formData);
        }}
      >
        {({ pending, error, success }) => (
          <>
            <textarea
              name="description"
              defaultValue={room.description ?? ""}
              placeholder="Notes / couchage (ex. Lit 140, Douche…)"
              rows={2}
              className="w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
            <div className="mt-1 flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
    </li>
  );
}
