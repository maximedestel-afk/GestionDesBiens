"use client";

import { useState, useTransition } from "react";
import { dismissChecklistItem } from "@/lib/inventaire/actions";

export function MissingFieldFlag({ propertyId, checkKey }: { propertyId: string; checkKey: string }) {
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();

  if (hidden) return null;

  return (
    <button
      type="button"
      disabled={pending}
      title="Information manquante — cliquer pour marquer comme normal (ne plus signaler)"
      onClick={() => {
        setHidden(true);
        startTransition(() => {
          dismissChecklistItem(propertyId, checkKey).catch(() => setHidden(false));
        });
      }}
      className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] leading-none text-amber-600 transition hover:bg-amber-100 disabled:opacity-50"
    >
      ⚠️
    </button>
  );
}
