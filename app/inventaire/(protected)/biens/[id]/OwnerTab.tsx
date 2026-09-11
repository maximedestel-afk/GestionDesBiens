"use client";

import { useRef, useState, type RefObject } from "react";
import type { Attachment, OwnerDirectoryEntry, PropertyElement, PropertyOwner } from "@/lib/inventaire/types";
import { savePropertyOwner } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { AddressAutocomplete } from "@/components/inventaire/AddressAutocomplete";
import { MissingFieldFlag } from "@/components/inventaire/MissingFieldFlag";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

const FIELD_INPUT_CLASS =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  inputRef,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={2} className={FIELD_INPUT_CLASS} />
      ) : (
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          className={FIELD_INPUT_CLASS}
        />
      )}
    </div>
  );
}

/** Un même propriétaire peut être renseigné sur plusieurs biens : on
 * regroupe l'annuaire par nom+prénom+email pour "Réutiliser un
 * propriétaire existant", avec la liste des références concernées. */
interface DedupedOwner {
  key: string;
  lastName: string | null;
  firstName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  references: string[];
}

function dedupeOwners(directory: OwnerDirectoryEntry[]): DedupedOwner[] {
  const byKey = new Map<string, DedupedOwner>();
  for (const entry of directory) {
    const key = `${entry.lastName ?? ""}|${entry.firstName ?? ""}|${entry.email ?? ""}`;
    const existing = byKey.get(key);
    if (existing) {
      if (entry.propertyReference) existing.references.push(entry.propertyReference);
      continue;
    }
    byKey.set(key, {
      key,
      lastName: entry.lastName,
      firstName: entry.firstName,
      email: entry.email,
      phone: entry.phone,
      address: entry.address,
      references: entry.propertyReference ? [entry.propertyReference] : [],
    });
  }
  return Array.from(byKey.values());
}

/** Champ "Nom" avec autocomplétion sur les propriétaires déjà renseignés
 * sur d'autres biens — cliquer une suggestion remplit aussi prénom, email,
 * téléphone et adresse (via onSelect, géré par le parent). */
function OwnerNameField({
  defaultValue,
  directory,
  onSelect,
}: {
  defaultValue: string | null | undefined;
  directory: OwnerDirectoryEntry[];
  onSelect: (owner: DedupedOwner) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const deduped = dedupeOwners(directory);
  const term = query.trim().toLowerCase();
  const matches = term
    ? deduped.filter((o) => `${o.lastName ?? ""} ${o.firstName ?? ""}`.toLowerCase().includes(term))
    : deduped;

  const select = (owner: DedupedOwner) => {
    if (inputRef.current) {
      inputRef.current.value = owner.lastName ?? "";
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setQuery(owner.lastName ?? "");
    setOpen(false);
    onSelect(owner);
  };

  return (
    <div className="relative">
      <label className="field-label" htmlFor="lastName">
        Nom
      </label>
      <input
        ref={inputRef}
        id="lastName"
        name="lastName"
        defaultValue={defaultValue ?? ""}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={FIELD_INPUT_CLASS}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          {matches.map((o) => (
            <button
              key={o.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(o)}
              className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
            >
              {[o.lastName, o.firstName].filter(Boolean).join(" ") || "(sans nom)"}
              {o.references.length > 0 && (
                <span className="ml-1.5 text-[#6e6e73]">— {o.references.join(", ")}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const AMOUNT_INPUT_CLASS = FIELD_INPUT_CLASS;

function parseAmount(value: string): number {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function RentFieldset({ owner }: { owner: PropertyOwner | null }) {
  const [rent, setRent] = useState(owner?.rentAmount != null ? String(owner.rentAmount) : "");
  const [charges, setCharges] = useState(owner?.chargesAmount != null ? String(owner.chargesAmount) : "");
  const [other, setOther] = useState(owner?.otherAmount != null ? String(owner.otherAmount) : "");

  const total = parseAmount(rent) + parseAmount(charges) + parseAmount(other);

  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Loyer</legend>
      <div className="mt-2 space-y-3">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
            <input
              type="radio"
              name="rentType"
              value="fixe"
              defaultChecked={owner?.rentType === "fixe"}
              className="h-4 w-4 accent-[#0071e3]"
            />
            Fixe
          </label>
          <label className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
            <input
              type="radio"
              name="rentType"
              value="fixe_variable"
              defaultChecked={owner?.rentType === "fixe_variable"}
              className="h-4 w-4 accent-[#0071e3]"
            />
            Fixe + Variable
          </label>
        </div>
        <div>
          <label className="field-label" htmlFor="rentAmount">
            Loyer
          </label>
          <input
            id="rentAmount"
            name="rentAmount"
            type="number"
            min={0}
            step="0.01"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            className={AMOUNT_INPUT_CLASS}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="chargesAmount">
            Charges
          </label>
          <input
            id="chargesAmount"
            name="chargesAmount"
            type="number"
            min={0}
            step="0.01"
            value={charges}
            onChange={(e) => setCharges(e.target.value)}
            className={AMOUNT_INPUT_CLASS}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="otherAmountLabel">
              Autre (précisez)
            </label>
            <input
              id="otherAmountLabel"
              name="otherAmountLabel"
              type="text"
              defaultValue={owner?.otherAmountLabel ?? ""}
              className={AMOUNT_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="otherAmount">
              Montant
            </label>
            <input
              id="otherAmount"
              name="otherAmount"
              type="number"
              min={0}
              step="0.01"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className={AMOUNT_INPUT_CLASS}
            />
          </div>
        </div>
        <Field label="Note" name="rentNotes" defaultValue={owner?.rentNotes} textarea />
        <div className="flex items-center justify-between rounded-[10px] bg-black/[0.03] px-3.5 py-2.5">
          <span className="text-[15px] font-semibold text-[#1d1d1f]">Total</span>
          <span className="text-[15px] font-semibold text-[#1d1d1f]">
            {total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
      </div>
    </fieldset>
  );
}

export function DocumentField({
  propertyId,
  title,
  attachments,
  emptyLabel,
  kind,
  noteName,
  noteValue,
  checkKey,
  missing,
}: {
  propertyId: string;
  title: string;
  attachments: Attachment[];
  emptyLabel: string;
  kind: "lease_contract" | "rib" | "rcp";
  noteName: string;
  noteValue: string | null | undefined;
  checkKey: string;
  missing: boolean;
}) {
  return (
    <fieldset className="rounded-2xl border border-black/[0.06] p-4">
      <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">
        {title}
        <MissingFieldFlag propertyId={propertyId} checkKey={checkKey} missing={missing} />
      </legend>
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
  missingCheckKeys,
  ownersDirectory,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  attachments: Attachment[];
  documents: PropertyElement[];
  documentAttachments: Attachment[];
  missingCheckKeys: string[];
  ownersDirectory: OwnerDirectoryEntry[];
}) {
  const ribAttachments = attachments.filter((a) => a.kind === "rib");

  const firstNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  function fillFromOwner(selected: DedupedOwner) {
    const setValue = (ref: RefObject<HTMLInputElement | null>, value: string | null) => {
      if (!ref.current) return;
      ref.current.value = value ?? "";
      ref.current.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setValue(firstNameRef, selected.firstName);
    setValue(emailRef, selected.email);
    setValue(phoneRef, selected.phone);
    const addressInput = document.getElementById("address") as HTMLInputElement | null;
    if (addressInput) {
      addressInput.value = selected.address ?? "";
      addressInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  return (
    <div className="space-y-4">
      <ActionForm className="space-y-4" autoSave action={(formData) => savePropertyOwner(propertyId, formData)}>
        {({ pending, error, success }) => (
          <>
            <fieldset className="card p-5">
              <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">
                Propriétaire
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="owner_info"
                  missing={missingCheckKeys.includes("owner_info")}
                />
              </legend>
              <div className="mt-2 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <OwnerNameField defaultValue={owner?.lastName} directory={ownersDirectory} onSelect={fillFromOwner} />
                  <Field label="Prénom" name="firstName" defaultValue={owner?.firstName} inputRef={firstNameRef} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email" name="email" type="email" defaultValue={owner?.email} inputRef={emailRef} />
                  <Field label="Téléphone" name="phone" type="tel" defaultValue={owner?.phone} inputRef={phoneRef} />
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

            <RentFieldset owner={owner} />

            <fieldset className="card space-y-3 p-5">
              <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Documents</legend>
              <p className="text-[13px] text-[#6e6e73]">
                Le bail et la RCP se trouvent désormais dans l&apos;onglet Documents.
              </p>
              <DocumentField
                propertyId={propertyId}
                title="RIB"
                attachments={ribAttachments}
                emptyLabel="Aucun RIB joint"
                kind="rib"
                noteName="ribNotes"
                noteValue={owner?.ribNotes}
                checkKey="rib"
                missing={missingCheckKeys.includes("rib")}
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
