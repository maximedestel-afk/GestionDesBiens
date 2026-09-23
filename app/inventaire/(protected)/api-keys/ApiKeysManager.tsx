"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { ApiKey } from "@/lib/inventaire/types";
import { createApiKey, revokeApiKey } from "@/lib/inventaire/actions";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

export function ApiKeysManager({ keys }: { keys: ApiKey[] }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        const rawKey = await createApiKey(name);
        setNewKey(rawKey);
        setName("");
        setCopied(false);
      } catch (e) {
        unstable_rethrow(e);
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div>
      {newKey && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-[13px] font-semibold text-amber-800">
            Clé créée — notez-la maintenant, elle ne sera plus jamais affichée.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-lg bg-white px-3 py-2 text-[13px] text-[#1d1d1f]">{newKey}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(newKey).catch(() => {});
                setCopied(true);
              }}
              className="btn-secondary btn-sm"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
            <button type="button" onClick={() => setNewKey(null)} className="btn-secondary btn-sm">
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <label className="block text-[12px] font-medium text-[#6e6e73]">Nom de la clé (ex. « Logiciel Ménage »)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          />
        </div>
        <button type="button" disabled={pending || !name.trim()} onClick={handleCreate} className="btn-primary">
          {pending ? "…" : "Créer une clé"}
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

      <div className="mt-5 overflow-visible rounded-2xl border border-black/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-left text-xs uppercase tracking-wide text-black/35">
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Clé</th>
              <th className="px-4 py-2 font-medium">Créée le</th>
              <th className="px-4 py-2 font-medium">Dernière utilisation</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-[13px] text-black/35">
                  Aucune clé API pour l&apos;instant.
                </td>
              </tr>
            )}
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-black/[0.06] last:border-0">
                <td className="px-4 py-2">{key.name}</td>
                <td className="px-4 py-2">
                  <code className="text-[12px] text-[#6e6e73]">{key.keyPrefix}…</code>
                </td>
                <td className="px-4 py-2 text-[13px] text-[#6e6e73]">{formatDate(key.createdAt)}</td>
                <td className="px-4 py-2 text-[13px] text-[#6e6e73]">{formatDate(key.lastUsedAt)}</td>
                <td className="px-4 py-2">
                  {key.revokedAt ? (
                    <span className="text-[13px] text-red-600">Révoquée</span>
                  ) : (
                    <span className="text-[13px] text-emerald-600">Active</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {!key.revokedAt && (
                    <ConfirmDeleteButton
                      label="Révoquer"
                      confirmText={`Révoquer la clé « ${key.name} » ? Le programme qui l'utilise perdra immédiatement l'accès.`}
                      action={() => revokeApiKey(key.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
