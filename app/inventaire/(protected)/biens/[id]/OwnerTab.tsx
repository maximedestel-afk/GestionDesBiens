"use client";

import type { Attachment, PropertyElement, PropertyOwner } from "@/lib/inventaire/types";
import { savePropertyOwner } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { AddressAutocomplete } from "@/components/inventaire/AddressAutocomplete";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

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
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={2}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      )}
    </div>
  );
}

function DocumentField({
  propertyId,
  title,
  attachments,
  emptyLabel,
  kind,
  noteName,
  noteValue,
}: {
  propertyId: string;
  title: string;
  attachments: Attachment[];
  emptyLabel: string;
  kind: "lease_contract" | "rib" | "rcp";
  noteName: string;
  noteValue: string | null | undefined;
}) {
  return (
    <fieldset className="rounded-2xl border border-black/[0.06] p-4">
      <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">{title}</legend>
      <div className="mt-2 space-y-2">
        <AttachmentGallery propertyId={propertyId} attachments={attachments} emptyLabel={emptyLabel} variant="list" />
        <FileUploadButtons
          accept=".pdf,.doc,.docx,image/*"
          showCamera={false}
          target={{ propertyId, entityType: "property", entityId: propertyId, kind }}
        />
        <Field label="Note" name={noteName} defaultValue={noteValue} textarea />
      </div>
    </fieldset>
  );
}

export function OwnerTab({
  propertyId,
  owner,
  attachments,
  documents,
  documentAttachments,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  attachments: Attachment[];
  documents: PropertyElement[];
  documentAttachments: Attachment[];
}) {
  const leaseAttachments = attachments.filter((a) => a.kind === "lease_contract");
  const ribAttachments = attachments.filter((a) => a.kind === "rib");
  const rcpAttachments = attachments.filter((a) => a.kind === "rcp");

  return (
    <div className="space-y-4">
      <ActionForm className="space-y-4" autoSave action={(formData) => savePropertyOwner(propertyId, formData)}>
        {({ pending, error, success }) => (
          <>
            <fieldset className="card p-5">
              <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Propriétaire</legend>
              <div className="mt-2 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nom" name="lastName" defaultValue={owner?.lastName} />
                  <Field label="Prénom" name="firstName" defaultValue={owner?.firstName} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email" name="email" type="email" defaultValue={owner?.email} />
                  <Field label="Téléphone" name="phone" type="tel" defaultValue={owner?.phone} />
                </div>
                <div>
                  <label className="field-label" htmlFor="address">
                    Adresse
                  </label>
                  <AddressAutocomplete
                    id="address"
                    name="address"
                    defaultValue={owner?.address}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
                <Field label="Notes" name="notes" defaultValue={owner?.notes} textarea />
              </div>
            </fieldset>

            <fieldset className="card space-y-3 p-5">
              <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Documents</legend>
              <DocumentField
                propertyId={propertyId}
                title="Bail"
                attachments={leaseAttachments}
                emptyLabel="Aucun bail joint"
                kind="lease_contract"
                noteName="leaseNotes"
                noteValue={owner?.leaseNotes}
              />
              <DocumentField
                propertyId={propertyId}
                title="RIB"
                attachments={ribAttachments}
                emptyLabel="Aucun RIB joint"
                kind="rib"
                noteName="ribNotes"
                noteValue={owner?.ribNotes}
              />
              <DocumentField
                propertyId={propertyId}
                title="RCP"
                attachments={rcpAttachments}
                emptyLabel="Aucune RCP jointe"
                kind="rcp"
                noteName="rcpNotes"
                noteValue={owner?.rcpNotes}
              />
            </fieldset>

            <SaveStatus pending={pending} error={error} success={success} />
          </>
        )}
      </ActionForm>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Autres documents</h2>
          <AddElementForm propertyId={propertyId} section="owner_documents" label="+ Ajouter un document" />
        </div>
        <div className="space-y-3">
          {documents.map((doc) => (
            <ElementCard
              key={doc.id}
              propertyId={propertyId}
              element={doc}
              attachments={documentAttachments.filter((a) => a.entityId === doc.id)}
              accept=".pdf,.doc,.docx,image/*"
              showCamera={false}
              galleryVariant="list"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
