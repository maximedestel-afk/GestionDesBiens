"use client";

import { useState, useTransition, type FormEvent } from "react";
import { importProperties, type ImportPropertiesResult } from "@/lib/inventaire/actions";

export function ImportPropertiesForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportPropertiesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await importProperties(formData);
        setResult(res);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        className="block w-full text-[14px] text-[#1d1d1f] file:mr-3 file:rounded-full file:border-0 file:bg-[#0071e3] file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-white file:transition hover:file:bg-[#0077ed]"
      />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Import en cours…" : "Importer"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-[10px] border border-black/10 bg-black/[0.02] p-3 text-[13px]">
          <p className="font-medium text-[#1d1d1f]">
            {result.created} bien{result.created !== 1 ? "s" : ""} créé{result.created !== 1 ? "s" : ""}
            {result.updated > 0 && `, ${result.updated} mis à jour`}.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-red-600">
                {result.errors.length} ligne{result.errors.length !== 1 ? "s" : ""} en erreur :
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-red-600">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Ligne {e.line} ({e.reference}) — {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
