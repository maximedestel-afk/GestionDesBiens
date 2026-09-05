"use client";

import { useState } from "react";
import type { ElementSection } from "@/lib/inventaire/types";
import { createPropertyElement } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";

export function AddElementForm({
  propertyId,
  section,
  label = "+ Ajouter un élément",
}: {
  propertyId: string;
  section: ElementSection;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        {label}
      </button>
    );
  }

  return (
    <ActionForm
      resetOnSuccess
      className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-slate-300 p-3"
      action={async (formData) => {
        await createPropertyElement(propertyId, section, formData);
        setOpen(false);
      }}
    >
      {({ pending, error }) => (
        <>
          <div className="min-w-[10rem] flex-1">
            <label className="block text-xs font-medium text-slate-500">Nom</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "…" : "Ajouter"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Annuler
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </>
      )}
    </ActionForm>
  );
}
