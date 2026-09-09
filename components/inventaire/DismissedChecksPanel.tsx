"use client";

import { useRef, useState, useTransition } from "react";
import type { CompletenessCheck } from "@/lib/inventaire/completeness";
import { undismissChecklistItem } from "@/lib/inventaire/actions";
import { tabCode } from "@/lib/inventaire/tabs";
import { useOutsideClick } from "./useOutsideClick";

export function DismissedChecksPanel({
  propertyId,
  checks,
}: {
  propertyId: string;
  checks: CompletenessCheck[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [restoring, setRestoring] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  if (checks.length === 0) return null;

  const restore = (checkKey: string) => {
    setRestoring(checkKey);
    startTransition(async () => {
      try {
        await undismissChecklistItem(propertyId, checkKey);
      } finally {
        setRestoring(null);
      }
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="link-quiet text-[13px]"
      >
        Éléments masqués ({checks.length})
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <p className="border-b border-black/[0.06] px-3.5 py-2 text-xs font-semibold text-[#6e6e73]">
            Marqués comme normaux pour ce bien
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {checks.map((check) => (
              <li
                key={check.key}
                className="flex items-center justify-between gap-2 border-b border-black/[0.04] px-3.5 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-[#1d1d1f]">{check.label}</p>
                  <p className="truncate text-[11px] text-[#6e6e73]">{tabCode(check.tab)}</p>
                </div>
                <button
                  type="button"
                  disabled={pending && restoring === check.key}
                  onClick={() => restore(check.key)}
                  className="shrink-0 rounded-full border border-black/10 px-2 py-1 text-[11px] text-[#6e6e73] transition hover:border-black/20 hover:text-[#1d1d1f] disabled:opacity-50"
                >
                  {pending && restoring === check.key ? "…" : "Réafficher"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
