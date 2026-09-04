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
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Nouveau bien
      </button>
      <dialog ref={dialogRef} className="w-96 max-w-[90vw] rounded-xl p-0 backdrop:bg-black/40">
        <form
          className="p-5"
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
          <h2 className="text-lg font-semibold text-slate-900">Nouveau bien</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="reference">
                Référence *
              </label>
              <input
                id="reference"
                name="reference"
                required
                placeholder="APT-001"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                Nom
              </label>
              <input
                id="name"
                name="name"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="address">
                Adresse
              </label>
              <input
                id="address"
                name="address"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
