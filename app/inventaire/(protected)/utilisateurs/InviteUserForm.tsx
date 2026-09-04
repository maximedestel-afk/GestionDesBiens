"use client";

import { inviteUser } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";

export function InviteUserForm() {
  return (
    <ActionForm className="flex flex-wrap items-end gap-2" resetOnSuccess action={inviteUser}>
      {({ pending, error, success }) => (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-500">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Rôle</label>
            <select
              name="role"
              defaultValue="menage"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="menage">Ménage</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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
