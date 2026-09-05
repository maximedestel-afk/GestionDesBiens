"use client";

import type { Attachment, PropertyOwner } from "@/lib/inventaire/types";
import { savePropertyOwner } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      )}
    </div>
  );
}

export function OwnerTab({
  propertyId,
  owner,
  attachments,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  attachments: Attachment[];
}) {
  const leaseAttachments = attachments.filter((a) => a.kind === "lease_contract");

  return (
    <div className="space-y-4">
      <ActionForm className="space-y-4" autoSave action={(formData) => savePropertyOwner(propertyId, formData)}>
        {({ pending, error, success }) => (
          <>
            <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-slate-900">Propriétaire</legend>
              <div className="mt-2 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nom" name="lastName" defaultValue={owner?.lastName} />
                  <Field label="Prénom" name="firstName" defaultValue={owner?.firstName} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email" name="email" type="email" defaultValue={owner?.email} />
                  <Field label="Téléphone" name="phone" type="tel" defaultValue={owner?.phone} />
                </div>
                <Field label="Adresse" name="address" defaultValue={owner?.address} />
                <Field label="Notes" name="notes" defaultValue={owner?.notes} textarea />
              </div>
            </fieldset>

            <SaveStatus pending={pending} error={error} success={success} />
          </>
        )}
      </ActionForm>

      <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Bail</legend>
        <div className="mt-2 space-y-2">
          <AttachmentGallery propertyId={propertyId} attachments={leaseAttachments} emptyLabel="Aucun bail joint" />
          <FileUploadButtons
            accept=".pdf,.doc,.docx,image/*"
            showCamera={false}
            target={{ propertyId, entityType: "property", entityId: propertyId, kind: "lease_contract" }}
          />
        </div>
      </fieldset>
    </div>
  );
}
