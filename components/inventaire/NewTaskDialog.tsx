"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { Profile, Property } from "@/lib/inventaire/types";
import { createTask } from "@/lib/inventaire/actions";

export function NewTaskDialog({ properties, profiles }: { properties: Property[]; profiles: Profile[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-1 rounded-full border-2 border-[#0071e3] px-3.5 py-1.5 text-sm font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/10"
      >
        + Nouvelle tâche
      </button>
      <dialog
        ref={dialogRef}
        className="card w-96 max-w-[90vw] overflow-visible p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm"
      >
        <form
          className="p-6"
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await createTask(formData);
                dialogRef.current?.close();
              } catch (e) {
                unstable_rethrow(e);
                setError(e instanceof Error ? e.message : "Une erreur est survenue.");
              }
            });
          }}
        >
          <h2 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f]">Nouvelle tâche</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="field-label" htmlFor="taskPropertyId">
                Appartement *
              </label>
              <select id="taskPropertyId" name="propertyId" required defaultValue="" className="field-input">
                <option value="" disabled>
                  Choisir un bien…
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.reference}
                    {p.name ? ` — ${p.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="taskText">
                Tâche *
              </label>
              <textarea
                id="taskText"
                name="text"
                required
                rows={2}
                placeholder="ex. Doubler clé puis remettre dans la Keybox et Keynest"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="taskAssignedTo">
                Assigner à (optionnel)
              </label>
              <select id="taskAssignedTo" name="assignedTo" defaultValue="" className="field-input">
                <option value="">Non assigné</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "…" : "Ajouter"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
