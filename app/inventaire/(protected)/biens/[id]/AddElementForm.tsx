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
        className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
      >
        {label}
      </button>
    );
  }

  return (
    <ActionForm
      resetOnSuccess
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-black/15 p-3.5"
      action={async (formData) => {
        await createPropertyElement(propertyId, section, formData);
        setOpen(false);
      }}
    >
      {({ pending, error }) => (
        <>
          <div className="min-w-[10rem] flex-1">
            <label className="block text-[12px] font-medium text-[#6e6e73]">Nom</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary"
          >
            {pending ? "…" : "Ajouter"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-secondary btn-sm"
          >
            Annuler
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </>
      )}
    </ActionForm>
  );
}
