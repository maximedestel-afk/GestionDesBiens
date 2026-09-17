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
import { FieldRef } from "@/components/inventaire/FieldRef";
import { OwnerPortalLinkButton } from "@/components/inventaire/OwnerPortalLinkButton";
import { NoteField } from "@/components/inventaire/NoteField";
import type { CsvFieldKey } from "@/lib/inventaire/csvFields";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

const FIELD_INPUT_CLASS =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  inputRef,
  csvKey,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  csvKey?: CsvFieldKey;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="field-label flex items-center" htmlFor={name}>
        {label}
        {csvKey && <FieldRef csvKey={csvKey} />}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          rows={2}
          className={FIELD_INPUT_CLASS}
        />
      ) : (
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
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
  birthDate: string | null;
  birthPlace: string | null;
  nationality: string | null;
  passportNumber: string | null;
  isCompany: boolean | null;
  companyName: string | null;
  companyLegalForm: string | null;
  companyCapital: string | null;
  companyAddress: string | null;
  companySiren: string | null;
  companyRcsCity: string | null;
  companyRepresentedBy: string | null;
  companyRole: string | null;
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
      birthDate: entry.birthDate,
      birthPlace: entry.birthPlace,
      nationality: entry.nationality,
      passportNumber: entry.passportNumber,
      isCompany: entry.isCompany,
      companyName: entry.companyName,
      companyLegalForm: entry.companyLegalForm,
      companyCapital: entry.companyCapital,
      companyAddress: entry.companyAddress,
      companySiren: entry.companySiren,
      companyRcsCity: entry.companyRcsCity,
      companyRepresentedBy: entry.companyRepresentedBy,
      companyRole: entry.companyRole,
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
      <label className="field-label flex items-center" htmlFor="lastName">
        Nom
        <FieldRef csvKey="ownerLastName" />
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

function RentFieldset({
  propertyId,
  owner,
  missingCheckKeys,
  rentType,
  setRentType,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  missingCheckKeys: string[];
  rentType: string;
  setRentType: (value: string) => void;
}) {
  const [rent, setRent] = useState(owner?.rentAmount != null ? String(owner.rentAmount) : "");
  const [charges, setCharges] = useState(owner?.chargesAmount != null ? String(owner.chargesAmount) : "");
  const [other, setOther] = useState(owner?.otherAmount != null ? String(owner.otherAmount) : "");

  const total = parseAmount(rent) + parseAmount(charges) + parseAmount(other);

  return (
    <fieldset className="card p-5">
      <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">
        Loyer
        <MissingFieldFlag
          propertyId={propertyId}
          checkKey="rent_type"
          missing={missingCheckKeys.includes("rent_type")}
        />
        <MissingFieldFlag
          propertyId={propertyId}
          checkKey="rent_amount"
          missing={missingCheckKeys.includes("rent_amount")}
        />
        <FieldRef csvKey="rentType" />
      </legend>
      <div className="mt-2 space-y-3">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
            <input
              type="radio"
              name="rentType"
              value="fixe"
              checked={rentType === "fixe"}
              onChange={(e) => setRentType(e.target.value)}
              className="h-4 w-4 accent-[#0071e3]"
            />
            Fixe
          </label>
          <label className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
            <input
              type="radio"
              name="rentType"
              value="variable"
              checked={rentType === "variable"}
              onChange={(e) => setRentType(e.target.value)}
              className="h-4 w-4 accent-[#0071e3]"
            />
            Variable
          </label>
          <label className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
            <input
              type="radio"
              name="rentType"
              value="fixe_variable"
              checked={rentType === "fixe_variable"}
              onChange={(e) => setRentType(e.target.value)}
              className="h-4 w-4 accent-[#0071e3]"
            />
            Fixe + Variable
          </label>
        </div>
        <div>
          <label className="field-label flex items-center" htmlFor="rentAmount">
            Loyer
            <FieldRef csvKey="rentAmount" />
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
          <label className="field-label flex items-center" htmlFor="chargesAmount">
            Charges
            <FieldRef csvKey="chargesAmount" />
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
            <label className="field-label flex items-center" htmlFor="otherAmountLabel">
              Autre (précisez)
              <FieldRef csvKey="otherAmountLabel" />
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
            <label className="field-label flex items-center" htmlFor="otherAmount">
              Montant
              <FieldRef csvKey="otherAmount" />
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
        <NoteField
          label="Note"
          name="rentNotes"
          defaultValue={owner?.rentNotes}
          labelExtra={<FieldRef csvKey="rentNotes" />}
        />
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

function CommissionFieldset({ owner, rentType }: { owner: PropertyOwner | null; rentType: string }) {
  const [commission, setCommission] = useState(owner?.commissionPercent != null ? String(owner.commissionPercent) : "");
  const isFixedRent = rentType === "fixe";

  return (
    <fieldset className="card p-5">
      <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">Commission</legend>
      <div className="mt-2">
        <label className="field-label flex items-center" htmlFor="commissionPercent">
          Commission (%)
          <FieldRef csvKey="commissionPercent" />
        </label>
        <input
          id="commissionPercent"
          name="commissionPercent"
          type="number"
          min={0}
          step="0.01"
          value={isFixedRent ? "" : commission}
          onChange={(e) => setCommission(e.target.value)}
          disabled={isFixedRent}
          title={isFixedRent ? "Sans objet pour un loyer fixe" : undefined}
          className={`${AMOUNT_INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-black/[0.04] disabled:text-black/40`}
        />
      </div>
    </fieldset>
  );
}

/** Coordonnées de la société quand le propriétaire est une personne
 * morale (SCI, SARL...) plutôt qu'une personne physique. La case à cocher
 * ne fait que montrer/masquer les champs ; un input caché "isCompany"
 * (toujours présent, contrairement à une checkbox non cochée qui
 * disparaîtrait du FormData) porte la vraie valeur envoyée au serveur.
 * `isCompany`/`setIsCompany` remontés au parent (OwnerTab) pour que
 * "Réutiliser un propriétaire existant" puisse cocher la case et afficher
 * les champs société avant de les remplir. */
function CompanyFieldset({
  owner,
  isCompany,
  setIsCompany,
}: {
  owner: PropertyOwner | null;
  isCompany: boolean;
  setIsCompany: (value: boolean) => void;
}) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Si société</legend>
      <label className="mt-1 flex items-center gap-2 text-[15px] text-[#1d1d1f]">
        <input
          type="checkbox"
          checked={isCompany}
          onChange={(e) => setIsCompany(e.target.checked)}
          className="h-4 w-4 accent-[#0071e3]"
        />
        Le propriétaire est une société
      </label>
      <input type="hidden" name="isCompany" value={isCompany ? "true" : "false"} />

      {isCompany && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom société" name="companyName" defaultValue={owner?.companyName} csvKey="ownerCompanyName" />
            <Field
              label="Forme société"
              name="companyLegalForm"
              defaultValue={owner?.companyLegalForm}
              csvKey="ownerCompanyLegalForm"
              placeholder="Ex. SCI, SARL, SAS…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Capital société"
              name="companyCapital"
              defaultValue={owner?.companyCapital}
              csvKey="ownerCompanyCapital"
            />
            <Field
              label="SIREN société"
              name="companySiren"
              defaultValue={owner?.companySiren}
              csvKey="ownerCompanySiren"
            />
          </div>
          <Field
            label="Adresse société"
            name="companyAddress"
            defaultValue={owner?.companyAddress}
            csvKey="ownerCompanyAddress"
          />
          <Field label="Ville RCS" name="companyRcsCity" defaultValue={owner?.companyRcsCity} csvKey="ownerCompanyRcsCity" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Représenté par"
              name="companyRepresentedBy"
              defaultValue={owner?.companyRepresentedBy}
              csvKey="ownerCompanyRepresentedBy"
            />
            <Field
              label="Qualité"
              name="companyRole"
              defaultValue={owner?.companyRole}
              csvKey="ownerCompanyRole"
              placeholder="Ex. gérant"
            />
          </div>
        </div>
      )}
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
  noteCsvKey,
  checkKey,
  missing,
  extraFields,
}: {
  propertyId: string;
  title: string;
  attachments: Attachment[];
  emptyLabel: string;
  kind: "lease_contract" | "rib" | "rcp";
  noteName: string;
  noteValue: string | null | undefined;
  noteCsvKey?: CsvFieldKey;
  checkKey: string;
  missing: boolean;
  /** Champs additionnels propres à ce type de document (ex. date de début
   * du bail), affichés avant les pièces jointes. */
  extraFields?: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-black/[0.06] p-4">
      <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">
        {title}
        <MissingFieldFlag propertyId={propertyId} checkKey={checkKey} missing={missing} />
      </legend>
      <div className="mt-2 space-y-2">
        {extraFields}
        <AttachmentGallery propertyId={propertyId} attachments={attachments} emptyLabel={emptyLabel} variant="list" />
        <FileUploadButtons
          accept=".pdf,.doc,.docx,image/*"
          showCamera={false}
          target={{ propertyId, entityType: "property", entityId: propertyId, kind }}
        />
        <NoteField
          label="Note"
          name={noteName}
          defaultValue={noteValue}
          labelExtra={noteCsvKey && <FieldRef csvKey={noteCsvKey} />}
        />
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

  // Remonté ici (plutôt que local à CompanyFieldset) pour que "Réutiliser un
  // propriétaire existant" puisse cocher la case et afficher les champs
  // société avant de les remplir via fillFromOwner.
  const hasCompanyData = !!(
    owner?.companyName ||
    owner?.companyLegalForm ||
    owner?.companyCapital ||
    owner?.companyAddress ||
    owner?.companySiren ||
    owner?.companyRcsCity ||
    owner?.companyRepresentedBy ||
    owner?.companyRole
  );
  const [isCompany, setIsCompany] = useState(!!owner?.isCompany || hasCompanyData);
  // Remonté ici pour que CommissionFieldset (case séparée) sache si le
  // champ Commission doit être grisé, sans dupliquer l'état du type de loyer.
  const [rentType, setRentType] = useState(owner?.rentType ?? "");

  function fillFromOwner(selected: DedupedOwner) {
    const setValue = (ref: RefObject<HTMLInputElement | null>, value: string | null) => {
      if (!ref.current) return;
      ref.current.value = value ?? "";
      ref.current.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const setValueById = (id: string, value: string | null) => {
      const input = document.getElementById(id) as HTMLInputElement | null;
      if (!input) return;
      input.value = value ?? "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    setValue(firstNameRef, selected.firstName);
    setValue(emailRef, selected.email);
    setValue(phoneRef, selected.phone);
    // Ces informations d'identité sont propres à la personne, pas au bien :
    // toujours les mêmes d'une fiche à l'autre pour le même propriétaire.
    setValueById("address", selected.address);
    setValueById("birthDate", selected.birthDate);
    setValueById("birthPlace", selected.birthPlace);
    setValueById("nationality", selected.nationality);
    setValueById("passportNumber", selected.passportNumber);

    const selectedHasCompanyData = !!(
      selected.companyName ||
      selected.companyLegalForm ||
      selected.companyCapital ||
      selected.companyAddress ||
      selected.companySiren ||
      selected.companyRcsCity ||
      selected.companyRepresentedBy ||
      selected.companyRole
    );
    setIsCompany(!!selected.isCompany || selectedHasCompanyData);
    // Les champs société ne sont montés dans le DOM que si la case est
    // cochée : on laisse React re-rendre avant de les remplir.
    setTimeout(() => {
      setValueById("companyName", selected.companyName);
      setValueById("companyLegalForm", selected.companyLegalForm);
      setValueById("companyCapital", selected.companyCapital);
      setValueById("companyAddress", selected.companyAddress);
      setValueById("companySiren", selected.companySiren);
      setValueById("companyRcsCity", selected.companyRcsCity);
      setValueById("companyRepresentedBy", selected.companyRepresentedBy);
      setValueById("companyRole", selected.companyRole);
    }, 0);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OwnerPortalLinkButton />
      </div>
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
                  <Field
                    label="Prénom"
                    name="firstName"
                    defaultValue={owner?.firstName}
                    inputRef={firstNameRef}
                    csvKey="ownerFirstName"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={owner?.email}
                    inputRef={emailRef}
                    csvKey="ownerEmail"
                  />
                  <Field
                    label="Téléphone"
                    name="phone"
                    type="tel"
                    defaultValue={owner?.phone}
                    inputRef={phoneRef}
                    csvKey="ownerPhone"
                  />
                </div>
                <div>
                  <label className="field-label flex items-center" htmlFor="address">
                    Adresse
                    <FieldRef csvKey="ownerAddress" />
                  </label>
                  <AddressAutocomplete
                    id="address"
                    name="address"
                    defaultValue={owner?.address}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Date de naissance"
                    name="birthDate"
                    defaultValue={owner?.birthDate}
                    csvKey="ownerBirthDate"
                  />
                  <Field
                    label="Lieu de naissance"
                    name="birthPlace"
                    defaultValue={owner?.birthPlace}
                    csvKey="ownerBirthPlace"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Nationalité"
                    name="nationality"
                    defaultValue={owner?.nationality}
                    csvKey="ownerNationality"
                  />
                  <Field
                    label="Numéro de passeport"
                    name="passportNumber"
                    defaultValue={owner?.passportNumber}
                    csvKey="ownerPassportNumber"
                  />
                </div>
                <NoteField
                  label="Notes"
                  name="notes"
                  defaultValue={owner?.notes}
                  labelExtra={<FieldRef csvKey="ownerNotes" />}
                />
              </div>
            </fieldset>

            <CompanyFieldset owner={owner} isCompany={isCompany} setIsCompany={setIsCompany} />

            <RentFieldset
              propertyId={propertyId}
              owner={owner}
              missingCheckKeys={missingCheckKeys}
              rentType={rentType}
              setRentType={setRentType}
            />

            <CommissionFieldset owner={owner} rentType={rentType} />

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
                noteCsvKey="ribNotes"
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
