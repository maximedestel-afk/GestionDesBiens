"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewLeaseForm() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!clientName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      router.push(`/admin/leases/${data.lease.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-slate-700">
          Nom du client / locataire
        </label>
        <input
          id="clientName"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="ex : Denali Investments Limited"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !clientName.trim()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer le dossier"}
      </button>
    </form>
  );
}
