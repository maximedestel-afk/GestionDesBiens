"use client";

import { useState } from "react";
import { deleteUserAccount, updateUserPassword } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";

function ChangePasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="link-quiet text-[13px]">
        Changer le mot de passe
      </button>
    );
  }

  return (
    <ActionForm
      className="flex flex-wrap items-end gap-2"
      resetOnSuccess
      action={async (formData) => {
        await updateUserPassword(userId, formData);
        setOpen(false);
      }}
    >
      {({ pending, error }) => (
        <>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoFocus
            placeholder="Nouveau mot de passe"
            className="w-40 rounded-[10px] border border-black/10 bg-white px-3 py-1.5 text-[13px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          />
          <button type="submit" disabled={pending} className="btn-primary btn-sm">
            {pending ? "…" : "Valider"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary btn-sm">
            Annuler
          </button>
          {error && <span className="text-[13px] text-red-600">{error}</span>}
        </>
      )}
    </ActionForm>
  );
}

export function UserActions({
  userId,
  email,
  isSelf,
}: {
  userId: string;
  email: string;
  isSelf: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <ChangePasswordForm userId={userId} />
      {!isSelf && (
        <ConfirmDeleteButton
          confirmText={`Supprimer définitivement le compte « ${email} » ? Cette action est irréversible.`}
          action={() => deleteUserAccount(userId)}
        />
      )}
    </div>
  );
}
