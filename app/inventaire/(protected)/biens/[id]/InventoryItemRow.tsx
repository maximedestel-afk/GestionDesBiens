"use client";

import { useRef, useState, useTransition } from "react";
import type { Attachment, InventoryItem, ItemCondition } from "@/lib/inventaire/types";
import { deleteInventoryItem, updateInventoryDetails, updateInventoryStock, updateInventoryTarget } from "@/lib/inventaire/actions";
import { NumericKeypadButton } from "@/components/inventaire/NumericKeypadButton";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";

const CONDITIONS: ItemCondition[] = ["Bon", "Usé", "À remplacer"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function InventoryItemRow({
  propertyId,
  item,
  attachments,
}: {
  propertyId: string;
  item: InventoryItem;
  attachments: Attachment[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const gapClass =
    item.gap > 0 ? "text-emerald-600" : item.gap < 0 ? "text-red-600" : "text-[#6e6e73]";
  const gapLabel = item.gap > 0 ? `+${item.gap}` : String(item.gap);

  return (
    <tr className="border-b border-black/[0.06] last:border-0">
      <td className="py-2 pr-3">
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="text-left font-medium text-[#1d1d1f] hover:underline"
        >
          {item.name}
        </button>
        <dialog ref={dialogRef} className="w-[26rem] max-w-[92vw] rounded-xl p-0 backdrop:bg-black/40">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1d1d1f]">{item.name}</h3>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="text-black/35 hover:text-[#6e6e73]"
              >
                ✕
              </button>
            </div>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                setError(null);
                startTransition(async () => {
                  try {
                    await updateInventoryDetails(propertyId, item.id, formData);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Erreur.");
                  }
                });
              }}
            >
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">État</label>
                <select
                  name="condition"
                  defaultValue={item.condition}
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={item.notes ?? ""}
                  rows={2}
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#6e6e73]">Photos</p>
                <div className="mt-1 space-y-2">
                  <AttachmentGallery propertyId={propertyId} attachments={attachments} emptyLabel="Aucune photo" />
                  <FileUploadButtons
                    target={{
                      propertyId,
                      entityType: "inventory_item",
                      entityId: item.id,
                      kind: "inventory_item_photo",
                    }}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-3">
                <ConfirmDeleteButton
                  confirmText={`Supprimer l'article « ${item.name} » ?`}
                  action={async () => {
                    await deleteInventoryItem(propertyId, item.id);
                    dialogRef.current?.close();
                  }}
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary"
                >
                  {pending ? "…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      </td>
      <td className="py-2 pr-3">
        <NumericKeypadButton
          value={item.inStock}
          label={`${item.name} — En stock`}
          onConfirm={(value) => updateInventoryStock(propertyId, item.id, value)}
        />
      </td>
      <td className="py-2 pr-3">
        {item.isTableware ? (
          <span className="inline-flex items-center gap-1 rounded border border-black/10 bg-black/[0.04] px-2 py-1 font-mono text-base tabular-nums text-[#6e6e73]">
            {item.effectiveTarget}
            <span className="rounded bg-black/[0.06] px-1 text-[10px] font-sans uppercase tracking-wide">auto</span>
          </span>
        ) : (
          <NumericKeypadButton
            value={item.effectiveTarget}
            label={`${item.name} — Cible`}
            onConfirm={(value) => updateInventoryTarget(propertyId, item.id, value)}
          />
        )}
      </td>
      <td className={`py-2 pr-3 font-mono tabular-nums ${gapClass}`}>{gapLabel}</td>
      <td className="py-2 pr-3 text-sm text-[#6e6e73]">{formatDate(item.stockUpdatedAt)}</td>
    </tr>
  );
}
