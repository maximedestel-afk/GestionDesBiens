"use client";

import { updateRolePermissions } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { MultiSelectDropdown } from "@/components/inventaire/MultiSelectDropdown";
import { SELECTABLE_SECTIONS } from "@/lib/inventaire/tabs";
import type { UserRole } from "@/lib/inventaire/types";

const PERMISSION_LEVEL_OPTIONS: { value: "read" | "write" | "delete"; label: string }[] = [
  { value: "read", label: "Lecture seule" },
  { value: "write", label: "Lecture + écriture" },
  { value: "delete", label: "Lecture + écriture + suppression" },
];

/** Onglets de bien / items du menu du haut, et niveau d'accréditation
 * (lecture seule, écriture, suppression), pour un rôle — partagé par tous
 * les utilisateurs de ce rôle. Onglets vides = rien de restreint. */
export function RolePermissionsEditor({
  role,
  allowedTabs,
  permissionLevel,
}: {
  role: UserRole;
  allowedTabs: string[];
  permissionLevel: "read" | "write" | "delete";
}) {
  return (
    <ActionForm
      className="flex flex-wrap items-center gap-2"
      autoSave
      action={(formData) =>
        updateRolePermissions(
          role,
          formData.getAll("allowedTabs").map(String),
          formData.get("permissionLevel") as "read" | "write" | "delete"
        )
      }
    >
      {({ pending, error, success }) => (
        <>
          <MultiSelectDropdown
            name="allowedTabs"
            placeholder="Tout autoriser (par défaut)…"
            defaultValues={allowedTabs}
            options={SELECTABLE_SECTIONS.map((t) => ({ value: t.key, label: t.label }))}
          />
          <select
            name="permissionLevel"
            defaultValue={permissionLevel}
            className="rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          >
            {PERMISSION_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <SaveStatus pending={pending} error={error} success={success} />
        </>
      )}
    </ActionForm>
  );
}
