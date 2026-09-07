"use client";

import { useRef, useState } from "react";

export function AddressAutocomplete({
  id,
  name,
  defaultValue,
  className,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const search = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
        );
        if (!res.ok) return;
        const data = await res.json();
        const labels: string[] = (data.features ?? []).map(
          (f: { properties: { label: string } }) => f.properties.label
        );
        setSuggestions(labels);
        setOpen(labels.length > 0);
      } catch {
        // Pas de connexion à l'API adresse : l'utilisateur peut toujours taper l'adresse manuellement.
      }
    }, 300);
  };

  const select = (label: string) => {
    if (inputRef.current) {
      inputRef.current.value = label;
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        autoComplete="off"
        onChange={(e) => search(e.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={className}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          {suggestions.map((label) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(label)}
              className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
