"use client";

import { useState } from "react";

export default function EditableClientName({ leaseId, initialName }: { leaseId: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft.trim() || draft === name) {
      setEditing(false);
      setDraft(name);
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/leases/${leaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: draft.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setName(draft.trim());
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="rounded-lg border border-slate-300 px-2 py-1 text-2xl font-semibold text-slate-900"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="cursor-pointer text-2xl font-semibold text-slate-900 hover:underline decoration-dashed"
      title="Cliquer pour renommer"
    >
      {name}
    </h1>
  );
}
