"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { Profile } from "@/lib/inventaire/types";
import { createTask } from "@/lib/inventaire/actions";
import { ScheduleFields } from "./ScheduleFields";

function profileLabel(p: Profile): string {
  return p.fullName || p.email;
}

export interface TaskQuickCreateDialogHandle {
  /** Ouvre le dialogue, pré-rempli avec cette date (YYYY-MM-DD). */
  open: (date: string) => void;
}

/** Variante de NewTaskDialog pour un bien déjà connu (pas de sélecteur de
 * bien) et une date imposée par l'appelant plutôt que choisie dans le
 * formulaire — utilisée par CalendarTab (clic sur un jour de l'onglet CAL).
 * Contrôlée via `ref.current.open(date)` plutôt qu'un bouton déclencheur
 * intégré : un seul dialogue est monté pour toute la grille de jours. */
export const TaskQuickCreateDialog = forwardRef<
  TaskQuickCreateDialogHandle,
  { propertyId: string; profiles: Profile[] }
>(function TaskQuickCreateDialog({ propertyId, profiles }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState("");
  // Change à chaque ouverture (même jour recliqué compris) pour forcer le
  // remontage du <form> ci-dessous : un <input type="date"> est non
  // contrôlé, donc changer `defaultDate` seul ne mettrait pas à jour sa
  // valeur affichée une fois le dialogue déjà monté une première fois.
  const [seq, setSeq] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    open: (d: string) => {
      setDate(d);
      setSeq((s) => s + 1);
      setError(null);
      dialogRef.current?.showModal();
    },
  }));

  return (
    <dialog
      ref={dialogRef}
      className="card w-96 max-w-[90vw] overflow-visible p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <form
        key={seq}
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
        <input type="hidden" name="propertyId" value={propertyId} />
        <h2 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f]">Nouveau RDV</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="field-label" htmlFor="calTaskText">
              Tâche *
            </label>
            <textarea
              id="calTaskText"
              name="text"
              required
              autoFocus
              rows={2}
              placeholder="ex. État des lieux, intervention technicien…"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="calTaskAssignedTo">
              Assigner à (optionnel)
            </label>
            <select id="calTaskAssignedTo" name="assignedTo" defaultValue="" className="field-input">
              <option value="">Non assigné</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {profileLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <ScheduleFields idPrefix="calTask" defaultDate={date} />
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
  );
});
