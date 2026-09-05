"use client";

import type { Attachment, PropertyAgencement, Room } from "@/lib/inventaire/types";
import { createRoom, saveAgencement } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { RoomRow } from "./RoomRow";

export function AgencementTab({
  propertyId,
  agencement,
  rooms,
  attachments,
}: {
  propertyId: string;
  agencement: PropertyAgencement | null;
  rooms: Room[];
  attachments: Attachment[];
}) {
  const visitVideos = attachments.filter((a) => a.kind === "visit_video");

  return (
    <div className="space-y-6">
      <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Capacité d&apos;accueil</legend>
        <ActionForm className="mt-2 space-y-3" autoSave action={(formData) => saveAgencement(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="capacity">
                    Nombre de personnes maximum
                  </label>
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={agencement?.capacity ?? ""}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 pt-6 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="babyBed"
                    value="true"
                    defaultChecked={agencement?.babyBed ?? false}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Lit bébé disponible
                </label>
              </div>
              <SaveStatus pending={pending} error={error} success={success} />
            </>
          )}
        </ActionForm>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Vidéo de visite</legend>
        <p className="text-sm text-slate-500">Vidéo lente montrant tout l&apos;appartement en détail.</p>
        <div className="mt-2 space-y-2">
          <AttachmentGallery propertyId={propertyId} attachments={visitVideos} />
          <FileUploadButtons
            accept="video/*"
            target={{ propertyId, entityType: "property", entityId: propertyId, kind: "visit_video" }}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Pièces &amp; couchages</legend>
        <p className="text-sm text-slate-500">
          Renseignez toutes les pièces du bien : elles alimentent le menu déroulant « Pièce » de l&apos;onglet
          Équipements techniques.
        </p>

        <ul className="mt-3 space-y-2">
          {rooms.map((room) => (
            <RoomRow key={room.id} propertyId={propertyId} room={room} />
          ))}
        </ul>

        <ActionForm
          className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4"
          resetOnSuccess
          action={(formData) => createRoom(propertyId, formData)}
        >
          {({ pending, error }) => (
            <>
              <div className="flex-1 min-w-[10rem]">
                <label className="block text-xs font-medium text-slate-500">Nom de la pièce</label>
                <input
                  name="name"
                  required
                  placeholder="Chambre 1"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <div className="flex-1 min-w-[12rem]">
                <label className="block text-xs font-medium text-slate-500">Couchage / équipement</label>
                <input
                  name="description"
                  placeholder="Lit 140, Douche…"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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
