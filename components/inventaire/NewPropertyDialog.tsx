"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { createProperty } from "@/lib/inventaire/actions";

export function NewPropertyDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className="btn-primary">
        + Nouveau bien
      </button>
      <dialog ref={dialogRef} className="card w-96 max-w-[90vw] p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm">
        <form
          className="p-6"
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await createProperty(formData);
              } catch (e) {
                unstable_rethrow(e);
                setError(e instanceof Error ? e.message : "Une erreur est survenue.");
              }
            });
          }}
        >
          <h2 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f]">Nouveau bien</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="field-label" htmlFor="reference">
                Référence *
              </label>
              <input id="reference" name="reference" required placeholder="APT-001" className="field-input" />
            </div>
            <div>
              <label className="field-label" htmlFor="name">
                Nom
              </label>
              <input id="name" name="name" className="field-input" />
            </div>
            <div>
              <label className="field-label" htmlFor="address">
                Adresse
              </label>
              <input id="address" name="address" className="field-input" />
            </div>
          </div>
          {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
