"use client";

import { useRef } from "react";
import type { Property } from "@/lib/inventaire/types";
import { updateProperty } from "@/lib/inventaire/actions";
import { ActionForm } from "./ActionForm";
import { SaveStatus } from "./SaveStatus";

export function EditPropertyDialog({ property }: { property: Property }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="ml-2 align-middle text-sm text-slate-400 hover:text-slate-700"
        aria-label="Modifier le bien"
        title="Modifier le bien"
      >
        ✏️
      </button>
      <dialog ref={dialogRef} className="w-96 max-w-[90vw] rounded-xl p-0 backdrop:bg-black/40">
        <ActionForm
          className="p-5"
          autoSave
          action={(formData) => updateProperty(property.id, formData)}
        >
          {({ pending, error, success }) => (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Modifier le bien</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="edit-reference">
                    Référence *
                  </label>
                  <input
                    id="edit-reference"
                    name="reference"
                    required
                    defaultValue={property.reference}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="edit-name">
                    Nom
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    defaultValue={property.name ?? ""}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="edit-address">
                    Adresse
                  </label>
                  <input
                    id="edit-address"
                    name="address"
                    defaultValue={property.address ?? ""}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <SaveStatus pending={pending} error={error} success={success} />
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
              </div>
            </>
          )}
        </ActionForm>
      </dialog>
    </>
  );
}
