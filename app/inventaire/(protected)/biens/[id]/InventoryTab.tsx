"use client";

import { useState, useTransition } from "react";
import { INVENTORY_CATEGORIES, type Attachment, type InventoryItem } from "@/lib/inventaire/types";
import { createInventoryItem, loadStandardInventory } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { InventoryItemRow } from "./InventoryItemRow";

function AddItemForm({ propertyId, category }: { propertyId: string; category: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-slate-600 hover:text-slate-900">
        + Ajouter un article
      </button>
    );
  }

  return (
    <ActionForm
      className="mt-2 flex flex-wrap items-end gap-2"
      resetOnSuccess
      action={async (formData) => {
        formData.set("category", category);
        await createInventoryItem(propertyId, formData);
      }}
    >
      {({ pending, error }) => (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-500">Nom</label>
            <input
              name="name"
              required
              className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">En stock</label>
            <input
              name="inStock"
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-20 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Cible</label>
            <input
              name="target"
              type="number"
              min={0}
              className="mt-1 w-20 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "…" : "Ajouter"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Annuler
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </>
      )}
    </ActionForm>
  );
}

function LoadStandardListButton({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await loadStandardInventory(propertyId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erreur.");
            }
          });
        }}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Chargement…" : "Charger la liste standard"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

export function InventoryTab({
  propertyId,
  items,
  attachments,
}: {
  propertyId: string;
  items: InventoryItem[];
  attachments: Attachment[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        <p className="text-sm text-slate-500">
          ~70 articles standards (hors linge de maison loué à chaque ménage).
        </p>
        <LoadStandardListButton propertyId={propertyId} />
      </div>

      {INVENTORY_CATEGORIES.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold text-slate-900">{category}</h2>
            {categoryItems.length > 0 && (
              <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-2 pl-3 pr-3 font-medium">Article</th>
                      <th className="py-2 pr-3 font-medium">En stock</th>
                      <th className="py-2 pr-3 font-medium">Cible</th>
                      <th className="py-2 pr-3 font-medium">Écart</th>
                      <th className="py-2 pr-3 font-medium">Date de saisie</th>
                    </tr>
                  </thead>
                  <tbody className="px-3">
                    {categoryItems.map((item) => (
                      <InventoryItemRow
                        key={item.id}
                        propertyId={propertyId}
                        item={item}
                        attachments={attachments.filter((a) => a.entityId === item.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-2 pl-1">
              <AddItemForm propertyId={propertyId} category={category} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
