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
        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      >
        <option value="admin">Admin</option>
        <option value="menage">Ménage</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
