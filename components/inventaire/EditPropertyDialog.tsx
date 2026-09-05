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
        className="ml-2 align-middle text-[15px] text-black/30 transition hover:text-[#1d1d1f]"
        aria-label="Modifier le bien"
        title="Modifier le bien"
      >
        ✏️
      </button>
      <dialog ref={dialogRef} className="card w-96 max-w-[90vw] p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm">
        <ActionForm className="p-6" autoSave action={(formData) => updateProperty(property.id, formData)}>
          {({ pending, error, success }) => (
            <>
              <h2 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f]">Modifier le bien</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="field-label" htmlFor="edit-reference">
                    Référence *
                  </label>
                  <input
                    id="edit-reference"
                    name="reference"
                    required
                    defaultValue={property.reference}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="edit-name">
                    Nom
                  </label>
                  <input id="edit-name" name="name" defaultValue={property.name ?? ""} className="field-input" />
                </div>
                <div>
                  <label className="field-label" htmlFor="edit-address">
                    Adresse
                  </label>
                  <input
                    id="edit-address"
                    name="address"
                    defaultValue={property.address ?? ""}
                    className="field-input"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <SaveStatus pending={pending} error={error} success={success} />
                <button type="button" onClick={() => dialogRef.current?.close()} className="btn-secondary btn-sm">
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
