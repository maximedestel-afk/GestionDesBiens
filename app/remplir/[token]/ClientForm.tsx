"use client";

import { useMemo, useState } from "react";
import type { FieldDTO, LeaseDTO } from "@/lib/serialize";
import { SECTIONS } from "@/lib/fields";

export default function ClientForm({
  token,
  lease,
  fields: initialFields,
}: {
  token: string;
  lease: LeaseDTO;
  fields: FieldDTO[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initialFields.map((f) => [f.id, f.value ?? ""]))
  );
  const [submitted, setSubmitted] = useState(!!lease.submittedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [missingIds, setMissingIds] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<string, FieldDTO[]> = {};
    for (const field of fields) {
      if (!map[field.section]) map[field.section] = [];
      map[field.section].push(field);
    }
    const orderedSections = [...SECTIONS, ...Object.keys(map).filter((s) => !SECTIONS.includes(s as (typeof SECTIONS)[number]))];
    return orderedSections.filter((s) => map[s]?.length).map((s) => [s, map[s]] as const);
  }, [fields]);

  async function save(submit: boolean) {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await fetch(`/api/client/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, submit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setMissingIds(new Set(data.missingFieldIds ?? []));
        return;
      }
      setMissingIds(new Set());
      setFields(data.fields);
      if (submit) {
        setSubmitted(true);
      } else {
        setSavedMessage("Brouillon enregistré.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (fields.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Aucune information n&apos;est actuellement demandée pour ce dossier.
      </p>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="font-medium text-emerald-800">Merci, vos informations ont bien été transmises.</p>
        <p className="mt-1 text-sm text-emerald-700">
          Votre interlocuteur va préparer votre contrat à partir de ces éléments.
        </p>
        <dl className="mt-4 space-y-2">
          {fields.map((f) => (
            <div key={f.id} className="text-sm">
              <dt className="font-medium text-emerald-900">{f.label}</dt>
              <dd className="text-emerald-800">{f.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([section, sectionFields]) => (
        <section key={section} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{section}</h2>
          <div className="space-y-4">
            {sectionFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    rows={3}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm ${
                      missingIds.has(field.id) ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                ) : field.type === "select" && field.options ? (
                  <select
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm ${
                      missingIds.has(field.id) ? "border-red-400" : "border-slate-300"
                    }`}
                  >
                    <option value="">Sélectionner...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm ${
                      missingIds.has(field.id) ? "border-red-400" : "border-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedMessage && <p className="text-sm text-emerald-600">{savedMessage}</p>}

      <div className="flex gap-3 pb-10">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Enregistrer le brouillon
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Envoyer mon dossier
        </button>
      </div>
    </div>
  );
}
