"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@/lib/inventaire/types";
import { updateUserRole } from "@/lib/inventaire/actions";

export function RoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const [value, setValue] = useState(role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as UserRole;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            try {
              await updateUserRole(userId, next);
            } catch (err) {
              setValue(previous);
              setError(err instanceof Error ? err.message : "Erreur.");
            }
          });
        }}
        className="rounded-[10px] border border-black/10 bg-white px-2.5 py-1.5 text-[13px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
      >
        <option value="admin">Admin</option>
        <option value="menage">Ménage</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
