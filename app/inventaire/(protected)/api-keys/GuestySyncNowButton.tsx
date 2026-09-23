"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { syncAllGuestyCleaningRatesNow } from "@/lib/inventaire/actions";

export function GuestySyncNowButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            try {
              const message = await syncAllGuestyCleaningRatesNow();
              setIsError(false);
              setResult(message);
            } catch (e) {
              unstable_rethrow(e);
              setIsError(true);
              setResult(e instanceof Error ? e.message : "Une erreur est survenue.");
            }
          });
        }}
        className="btn-primary"
      >
        {pending ? "Synchronisation en cours…" : "Synchroniser tous les biens maintenant"}
      </button>
      {result && <p className={`mt-2 text-[13px] ${isError ? "text-red-600" : "text-emerald-600"}`}>{result}</p>}
    </div>
  );
}
