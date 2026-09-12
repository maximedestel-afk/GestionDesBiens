"use client";

import { useState } from "react";
import type { Attachment, PropertyAgencement, Room, RoomBed } from "@/lib/inventaire/types";
import { createRoom, saveAgencement } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { MissingFieldFlag } from "@/components/inventaire/MissingFieldFlag";
import { FieldRef } from "@/components/inventaire/FieldRef";
import { RoomRow } from "./RoomRow";

const ROOM_TYPES = ["Chambre", "Cuisine", "Salon", "Salle à Manger", "WC", "SDB", "Espace Travail"] as const;

export function AgencementTab({
  propertyId,
  agencement,
  rooms,
  beds,
  attachments,
  missingCheckKeys,
}: {
  propertyId: string;
  agencement: PropertyAgencement | null;
  rooms: Room[];
  beds: RoomBed[];
  attachments: Attachment[];
  missingCheckKeys: string[];
}) {
  const visitVideos = attachments.filter((a) => a.kind === "visit_video");
  const plans = attachments.filter((a) => a.kind === "plan");
  const [roomType, setRoomType] = useState("");

  return (
    <div className="space-y-6">
      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Capacité d&apos;accueil</legend>
        <ActionForm className="mt-2 space-y-3" autoSave action={(formData) => saveAgencement(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="capacity">
                    Nombre de personnes maximum
                    <MissingFieldFlag
                      propertyId={propertyId}
                      checkKey="capacity"
                      missing={missingCheckKeys.includes("capacity")}
                    />
                    <FieldRef csvKey="capacity" />
                  </label>
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={agencement?.capacity ?? ""}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="surface">
                    Superficie (m²)
                    <MissingFieldFlag
                      propertyId={propertyId}
                      checkKey="surface"
                      missing={missingCheckKeys.includes("surface")}
                    />
                    <FieldRef csvKey="surface" />
                  </label>
                  <input
                    id="surface"
                    name="surface"
                    type="number"
                    min={0}
                    step="0.1"
                    defaultValue={agencement?.surface ?? ""}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
              </div>
              <SaveStatus pending={pending} error={error} success={success} />
            </>
          )}
        </ActionForm>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">
          Vidéo de visite
          <MissingFieldFlag
            propertyId={propertyId}
            checkKey="visit_video"
            missing={missingCheckKeys.includes("visit_video")}
          />
        </legend>
        <p className="text-sm text-[#6e6e73]">Vidéo lente montrant tout l&apos;appartement en détail.</p>
        <div className="mt-2 space-y-2">
          <AttachmentGallery propertyId={propertyId} attachments={visitVideos} />
          <FileUploadButtons
            accept="video/*"
            target={{ propertyId, entityType: "property", entityId: propertyId, kind: "visit_video" }}
          />
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Plan</legend>
        <p className="text-sm text-[#6e6e73]">Insérer le plan (même à main levée).</p>
        <div className="mt-2 space-y-2">
          <AttachmentGallery propertyId={propertyId} attachments={plans} emptyLabel="Aucun plan" />
          <FileUploadButtons
            accept=".pdf,.doc,.docx,image/*"
            target={{ propertyId, entityType: "property", entityId: propertyId, kind: "plan" }}
          />
        </div>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">
          Pièces &amp; couchages
          <MissingFieldFlag propertyId={propertyId} checkKey="rooms" missing={missingCheckKeys.includes("rooms")} />
          <MissingFieldFlag
            propertyId={propertyId}
            checkKey="beds_missing"
            missing={missingCheckKeys.includes("beds_missing")}
          />
        </legend>
        <p className="text-sm text-[#6e6e73]">
          Renseignez toutes les pièces du bien : elles alimentent le menu déroulant « Pièce » de l&apos;onglet
          Équipements techniques.
        </p>

        <ul className="mt-3 space-y-2">
          {rooms.map((room) => (
            <RoomRow
              key={room.id}
              propertyId={propertyId}
              room={room}
              beds={beds.filter((b) => b.roomId === room.id)}
            />
          ))}
        </ul>

        <ActionForm
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-black/[0.06] pt-4"
          resetOnSuccess
          onSuccess={() => setRoomType("")}
          action={(formData) => createRoom(propertyId, formData)}
        >
          {({ pending, error }) => (
            <>
              <div className="flex-1 min-w-[10rem]">
                <label className="block text-[12px] font-medium text-[#6e6e73]">Type de pièce</label>
                <select
                  name="roomType"
                  required
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                >
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="autre">Autre</option>
                </select>
              </div>
              {roomType === "autre" && (
                <div className="flex-1 min-w-[10rem]">
                  <label className="block text-[12px] font-medium text-[#6e6e73]">Précisez</label>
                  <input
                    name="customName"
                    required
                    placeholder="Nom de la pièce"
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
              )}
              <div className="flex-1 min-w-[12rem]">
                <label className="block text-[12px] font-medium text-[#6e6e73]">Couchage / équipement</label>
                <input
                  name="description"
                  placeholder="Lit 140, Douche…"
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="btn-primary"
              >
                {pending ? "…" : "+ Ajouter la pièce"}
              </button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </>
          )}
        </ActionForm>
      </fieldset>
    </div>
  );
}
