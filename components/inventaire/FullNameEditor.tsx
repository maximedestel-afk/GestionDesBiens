"use client";

import { useState, useTransition } from "react";
import { updateProfileFullName } from "@/lib/inventaire/actions";

export function FullNameEditor({ userId, fullName }: { userId: string; fullName: string | null }) {
  const [value, setValue] = useState(fullName ?? "");
  const [prevFullName, setPrevFullName] = useState(fullName ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Resynchronise avec la valeur confirmée par le serveur, comme RoleSelect
  // (voir ce composant pour le pourquoi).
  if ((fullName ?? "") !== prevFullName) {
    setPrevFullName(fullName ?? "");
    setValue(fullName ?? "");
  }

  function save() {
    if (value === (fullName ?? "")) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateProfileFullName(userId, value);
      } catch (err) {
        setValue(fullName ?? "");
        setError(err instanceof Error ? err.message : "Erreur.");
      }
    });
  }

  return (
    <div>
      <input
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder="Nom complet"
        className="w-full rounded-[10px] border border-black/10 bg-white px-2.5 py-1.5 text-[13px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
