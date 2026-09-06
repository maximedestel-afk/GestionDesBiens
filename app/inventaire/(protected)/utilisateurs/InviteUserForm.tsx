"use client";

import { inviteUser } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";

export function InviteUserForm() {
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
              defaultValue="menage"
              className="mt-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            >
              <option value="admin">Admin</option>
              <option value="menage">Ménage</option>
            </select>
          </div>
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
