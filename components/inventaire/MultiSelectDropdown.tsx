"use client";

import { useRef, useState } from "react";
import { useOutsideClick } from "./useOutsideClick";

export function MultiSelectDropdown({
  name,
  options,
  defaultValues = [],
  placeholder,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValues?: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValues));
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const label =
    selected.size === 0
      ? placeholder
      : selected.size === 1
        ? (options.find((o) => selected.has(o.value))?.label ?? "1 sélectionné")
        : `${selected.size} sélectionnés`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 w-56 truncate rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-left text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-64 overflow-y-auto rounded-[10px] border border-black/10 bg-white p-2 shadow-lg">
          {options.length === 0 ? (
            <p className="px-2 py-1 text-[13px] text-[#6e6e73]">Aucune option.</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[14px] text-[#1d1d1f] hover:bg-black/[0.03]"
              >
                <input
                  type="checkbox"
                  name={name}
                  value={opt.value}
                  checked={selected.has(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                {opt.label}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
