"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldDTO, LeaseDTO } from "@/lib/serialize";
import { SECTIONS } from "@/lib/fields";

type AssignedTo = FieldDTO["assignedTo"];

const ASSIGNMENT_LABELS: Record<AssignedTo, string> = {
  admin: "Je le remplis",
  client: "Le client le remplit",
  non_applicable: "Non applicable",
};

const FIELD_TYPES = [
  { value: "text", label: "Texte court" },
  { value: "textarea", label: "Texte long" },
  { value: "number", label: "Nombre" },
  { value: "date", label: "Date" },
  { value: "select", label: "Choix (oui/non...)" },
];

export default function LeaseEditor({
  lease: initialLease,
  fields: initialFields,
}: {
  lease: LeaseDTO;
  fields: FieldDTO[];
}) {
  const router = useRouter();
  const [lease, setLease] = useState(initialLease);
  const [fields, setFields] = useState(initialFields);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copier le lien");
  const [showAddField, setShowAddField] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, FieldDTO[]> = {};
    for (const field of fields) {
      if (!map[field.section]) map[field.section] = [];
      map[field.section].push(field);
    }
    const orderedSections = [...SECTIONS, ...Object.keys(map).filter((s) => !SECTIONS.includes(s as (typeof SECTIONS)[number]))];
    return orderedSections.filter((s) => map[s]?.length).map((s) => [s, map[s]] as const);
  }, [fields]);

  const clientFields = fields.filter((f) => f.assignedTo === "client");
  const filledClientFields = clientFields.filter((f) => f.value && f.value.trim() !== "").length;

  const [clientLink, setClientLink] = useState(`/remplir/${lease.token}`);
  useEffect(() => {
    setClientLink(`${window.location.origin}/remplir/${lease.token}`);
  }, [lease.token]);

  async function patchField(fieldId: string, patch: Record<string, unknown>) {
    setSavingId(fieldId);
    try {
      const res = await fetch(`/api/leases/${lease.id}/fields/${fieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setFields((prev) => prev.map((f) => (f.id === fieldId ? data.field : f)));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteField(fieldId: string) {
    if (!confirm("Supprimer ce champ personnalisé ?")) return;
    const res = await fetch(`/api/leases/${lease.id}/fields/${fieldId}`, { method: "DELETE" });
    if (res.ok) {
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(clientLink);
    setCopyLabel("Lien copié !");
    setTimeout(() => setCopyLabel("Copier le lien"), 1500);
  }

  async function handleReopen() {
    const res = await fetch(`/api/leases/${lease.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reopen: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setLease(data.lease);
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Lien à envoyer au client</p>
            <p className="mt-1 break-all text-sm text-slate-700">{clientLink}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {copyLabel}
            </button>
            {lease.submittedAt && (
              <button
                onClick={handleReopen}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                Rouvrir le dossier
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {lease.submittedAt
            ? `Dossier transmis par le client le ${new Date(lease.submittedAt).toLocaleString("fr-FR")}.`
            : `${filledClientFields} / ${clientFields.length} champ(s) client rempli(s) pour le moment.`}
        </p>
      </section>

      {grouped.map(([section, sectionFields]) => (
        <section key={section} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{section}</h2>
          <div className="space-y-4">
            {sectionFields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                saving={savingId === field.id}
                onPatch={(patch) => patchField(field.id, patch)}
                onDelete={field.isCustom ? () => deleteField(field.id) : undefined}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
        {!showAddField ? (
          <button
            onClick={() => setShowAddField(true)}
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            + Ajouter un champ personnalisé
          </button>
        ) : (
          <AddFieldForm
            leaseId={lease.id}
            onCreated={(field) => {
              setFields((prev) => [...prev, field]);
              setShowAddField(false);
            }}
            onCancel={() => setShowAddField(false)}
          />
        )}
      </section>
    </div>
  );
}

function FieldRow({
  field,
  saving,
  onPatch,
  onDelete,
}: {
  field: FieldDTO;
  saving: boolean;
  onPatch: (patch: Record<string, unknown>) => void;
  onDelete?: () => void;
}) {
  const [value, setValue] = useState(field.value ?? "");

  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          <p className="text-sm font-medium text-slate-800">{field.label}</p>
          {field.required && <span className="text-xs text-red-500">obligatoire</span>}
        </div>

        <select
          value={field.assignedTo}
          onChange={(e) => onPatch({ assignedTo: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          {(Object.keys(ASSIGNMENT_LABELS) as AssignedTo[]).map((key) => (
            <option key={key} value={key}>
              {ASSIGNMENT_LABELS[key]}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onPatch({ required: e.target.checked })}
          />
          Obligatoire
        </label>

        {onDelete && (
          <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">
            Supprimer
          </button>
        )}
      </div>

      <div className="mt-2">
        {field.assignedTo === "client" ? (
          <p className="text-sm text-slate-500">
            {field.value ? (
              <>
                Rempli par le client : <span className="font-medium text-slate-700">{field.value}</span>
              </>
            ) : (
              "En attente de saisie par le client."
            )}
          </p>
        ) : field.assignedTo === "non_applicable" ? (
          <p className="text-sm italic text-slate-400">Champ marqué non applicable pour ce dossier.</p>
        ) : field.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onPatch({ value })}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        ) : field.type === "select" && field.options ? (
          <select
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onPatch({ value: e.target.value });
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">—</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onPatch({ value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
        )}
      </div>
      {saving && <p className="mt-1 text-xs text-slate-400">Enregistrement...</p>}
    </div>
  );
}

function AddFieldForm({
  leaseId,
  onCreated,
  onCancel,
}: {
  leaseId: string;
  onCreated: (field: FieldDTO) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [section, setSection] = useState<string>(SECTIONS[0]);
  const [type, setType] = useState("text");
  const [assignedTo, setAssignedTo] = useState<AssignedTo>("client");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!label.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/leases/${leaseId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, section, type, assignedTo }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) onCreated(data.field);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Libellé du champ"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select value={section} onChange={(e) => setSection(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          {SECTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value as AssignedTo)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          {(Object.keys(ASSIGNMENT_LABELS) as AssignedTo[]).map((key) => (
            <option key={key} value={key}>
              {ASSIGNMENT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading || !label.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Ajouter
        </button>
        <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">
          Annuler
        </button>
      </div>
    </div>
  );
}
