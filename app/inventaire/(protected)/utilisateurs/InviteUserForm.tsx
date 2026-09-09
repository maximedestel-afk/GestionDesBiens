"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/inventaire/types";
import { inviteUser } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { MultiSelectDropdown } from "@/components/inventaire/MultiSelectDropdown";
import { PRESTATAIRE_SELECTABLE_TABS } from "@/lib/inventaire/tabs";

export function InviteUserForm({ properties }: { properties: { id: string; reference: string; name: string | null }[] }) {
  const [role, setRole] = useState<UserRole>("menage");

  return (
    <ActionForm className="flex flex-wrap items-end gap-2" resetOnSuccess action={inviteUser}>
      {({ pending, error, success }) => (
        <>
          <div>
            <label className="block text-[12px] font-medium text-[#6e6e73]">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-64 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6e6e73]">Rôle</label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            >
              <option value="admin">Admin</option>
              <option value="operations">Operations</option>
              <option value="menage">Ménage</option>
              <option value="prestataire">Prestataire</option>
            </select>
          </div>
          {role === "prestataire" && (
            <>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Biens visibles</label>
                <MultiSelectDropdown
                  name="propertyIds"
                  placeholder="Choisir les biens…"
                  options={properties.map((p) => ({
                    value: p.id,
                    label: p.name ? `${p.reference} — ${p.name}` : p.reference,
                  }))}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Onglets visibles</label>
                <MultiSelectDropdown
                  name="allowedTabs"
                  placeholder="Choisir les onglets…"
                  options={PRESTATAIRE_SELECTABLE_TABS.map((t) => ({ value: t.key, label: t.label }))}
                />
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary"
          >
            {pending ? "Envoi…" : "Inviter"}
          </button>
          {success && <span className="text-sm text-emerald-600">Invitation envoyée.</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </>
      )}
    </ActionForm>
  );
}
