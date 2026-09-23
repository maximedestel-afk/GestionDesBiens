"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { registerGuestyWebhook } from "@/lib/inventaire/actions";

export function GuestyWebhookSetup() {
  const [domain, setDomain] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[14rem] flex-1">
          <label className="block text-[12px] font-medium text-[#6e6e73]">
            Domaine de production (sans https://)
          </label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="gestion-des-biens.vercel.app"
            className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          />
        </div>
        <button
          type="button"
          disabled={pending || !domain.trim()}
          onClick={() => {
            setResult(null);
            startTransition(async () => {
              try {
                const message = await registerGuestyWebhook(domain);
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
          {pending ? "Création…" : "Créer le webhook Guesty"}
        </button>
      </div>
      {result && <p className={`mt-2 text-[13px] ${isError ? "text-red-600" : "text-emerald-600"}`}>{result}</p>}
    </div>
  );
}
