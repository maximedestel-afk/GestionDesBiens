import type { ActivityLogEntry } from "@/lib/inventaire/types";

const ACTION_LABELS: Record<ActivityLogEntry["action"], string> = {
  create: "Ajout",
  update: "Modification",
  delete: "Suppression",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ActivityLogPanel({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Historique des modifications</h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Aucune modification enregistrée.</p>
      ) : (
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
              <div>
                <span className="font-medium text-slate-700">{ACTION_LABELS[entry.action]}</span>{" "}
                <span className="text-slate-600">{entry.summary}</span>
                {entry.actorEmail && <span className="text-slate-400"> — {entry.actorEmail}</span>}
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">{formatDate(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
