"use client";

import { saveAppNotes } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";

export function AccesNotesForm({ content }: { content: string | null }) {
  return (
    <ActionForm className="card p-5" autoSave action={saveAppNotes}>
      {({ pending, error, success }) => (
        <>
          <div className="flex justify-end">
            <SaveStatus pending={pending} error={error} success={success} />
          </div>
          <textarea
            name="content"
            defaultValue={content ?? ""}
            rows={20}
            placeholder="Ex. : identifiants Supabase, GitHub, mots de passe divers…"
            className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 font-mono text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          />
        </>
      )}
    </ActionForm>
  );
}
