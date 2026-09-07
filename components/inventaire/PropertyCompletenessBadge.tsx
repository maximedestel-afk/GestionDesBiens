"use client";

import { useRef, useState, useTransition } from "react";
import type { CompletenessCheck } from "@/lib/inventaire/completeness";
import { dismissChecklistItem } from "@/lib/inventaire/actions";
import { useOutsideClick } from "./useOutsideClick";

export function PropertyCompletenessBadge({
  propertyId,
  missing,
}: {
  propertyId: string;
  missing: CompletenessCheck[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dismissing, setDismissing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  if (missing.length === 0) return null;

  const dismiss = (checkKey: string) => {
    setDismissing(checkKey);
    startTransition(async () => {
      try {
        await dismissChecklistItem(propertyId, checkKey);
      } finally {
        setDismissing(null);
      }
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={`${missing.length} information${missing.length > 1 ? "s" : ""} manquante${missing.length > 1 ? "s" : ""}`}
        className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
      >
        ⚠️ {missing.length}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          <p className="border-b border-black/[0.06] px-3.5 py-2 text-xs font-semibold text-[#6e6e73]">
            Données manquantes
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {missing.map((check) => (
              <li
                key={check.key}
                className="flex items-center justify-between gap-2 border-b border-black/[0.04] px-3.5 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-[#1d1d1f]">{check.label}</p>
                  <p className="truncate text-[11px] text-[#6e6e73]">{check.tab}</p>
                </div>
                <button
                  type="button"
                  disabled={pending && dismissing === check.key}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dismiss(check.key);
                  }}
                  className="shrink-0 rounded-full border border-black/10 px-2 py-1 text-[11px] text-[#6e6e73] transition hover:border-black/20 hover:text-[#1d1d1f] disabled:opacity-50"
                >
                  {pending && dismissing === check.key ? "…" : "Normal, ne plus signaler"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
