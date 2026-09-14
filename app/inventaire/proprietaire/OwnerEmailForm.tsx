"use client";

import { ownerLogin } from "@/lib/inventaire/ownerActions";
import { ActionForm } from "@/components/inventaire/ActionForm";

export function OwnerEmailForm() {
  return (
    <ActionForm action={ownerLogin} className="card mt-6 space-y-4 p-6">
      {({ pending, error }) => (
        <>
          <div>
            <label className="field-label" htmlFor="email">
              Votre adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
              className="field-input"
            />
          </div>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button type="submit" disabled={pending} className="w-full btn-primary justify-center">
            {pending ? "…" : "Accéder à mes informations"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
