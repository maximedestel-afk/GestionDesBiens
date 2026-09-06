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
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]">
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
            <label className="block text-[12px] font-medium text-[#6e6e73]">Nom</label>
            <input
              name="name"
              required
              className="mt-1 w-48 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6e6e73]">En stock</label>
            <input
              name="inStock"
              type="number"
              min={0}
              defaultValue={0}
              className="mt-1 w-20 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6e6e73]">Cible</label>
            <input
              name="target"
              type="number"
              min={0}
              className="mt-1 w-20 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary btn-sm"
          >
            {pending ? "…" : "Ajouter"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary btn-sm">
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
        className="btn-primary"
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-3.5">
        <p className="text-sm text-[#6e6e73]">
          ~70 articles standards (hors linge de maison loué à chaque ménage).
        </p>
        <LoadStandardListButton propertyId={propertyId} />
      </div>

      {INVENTORY_CATEGORIES.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        return (
          <section key={category}>
            <h2 className="text-sm font-semibold text-[#1d1d1f]">{category}</h2>
            {categoryItems.length > 0 && (
              <div className="mt-2 overflow-x-auto card">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-left text-xs uppercase tracking-wide text-black/35">
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
