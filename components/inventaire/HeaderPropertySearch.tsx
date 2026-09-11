"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { quickSearchProperties } from "@/lib/inventaire/actions";

export function HeaderPropertySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; reference: string; name: string | null }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = query.trim();
    const timeout = setTimeout(
      async () => {
        if (term.length < 2) {
          setResults([]);
          setOpen(false);
          return;
        }
        try {
          const matches = await quickSearchProperties(term);
          setResults(matches);
          setOpen(matches.length > 0);
        } catch {
          setResults([]);
        }
      },
      term.length < 2 ? 0 : 250
    );
    return () => clearTimeout(timeout);
  }, [query]);

  function select(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/inventaire/biens/${id}`);
  }

  return (
    <div className="relative w-full max-w-sm">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(results.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Rechercher un bien (référence, nom, propriétaire…)"
        className="w-full rounded-full border border-black/10 bg-black/[0.03] px-3.5 py-1.5 text-[13px] text-[#1d1d1f] transition focus:border-[#0071e3] focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
      />
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(p.id)}
              className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
            >
              {p.reference}
              {p.name && <span className="ml-1.5 text-[#6e6e73]">{p.name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
