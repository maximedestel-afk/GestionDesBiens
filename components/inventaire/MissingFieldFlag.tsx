"use client";

import { useState, useTransition } from "react";
import { dismissChecklistItem, undismissChecklistItem } from "@/lib/inventaire/actions";

type FlagState = "hidden" | "visible" | "just_dismissed";

export function MissingFieldFlag({
  propertyId,
  checkKey,
  missing,
}: {
  propertyId: string;
  checkKey: string;
  missing: boolean;
}) {
  // L'état local ne suit le prop `missing` qu'au montage : une fois masqué,
  // il reste affiché (avec l'option "Annuler") même après la revalidation
  // serveur qui suit le clic, le temps que l'utilisateur puisse se raviser.
  const [state, setState] = useState<FlagState>(missing ? "visible" : "hidden");
  const [pending, startTransition] = useTransition();

  if (state === "hidden") return null;

  if (state === "just_dismissed") {
    return (
      <span id={`missing-check-${checkKey}`} className="ml-1.5 inline-flex items-center gap-1 text-[11px] text-[#6e6e73]">
        Masqué ·
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setState("visible");
            startTransition(() => {
              undismissChecklistItem(propertyId, checkKey).catch(() => {});
            });
          }}
          className="text-sky-600 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Annuler
        </button>
      </span>
    );
  }

  return (
    <button
      id={`missing-check-${checkKey}`}
      type="button"
      disabled={pending}
      title="Information manquante — cliquer pour marquer comme normal (ne plus signaler)"
      onClick={() => {
        setState("just_dismissed");
        startTransition(() => {
          dismissChecklistItem(propertyId, checkKey).catch(() => setState("visible"));
        });
        window.setTimeout(() => setState((s) => (s === "just_dismissed" ? "hidden" : s)), 8000);
      }}
      className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none text-amber-600 transition hover:bg-amber-100 disabled:opacity-50"
    >
      ⚠️
    </button>
  );
}
