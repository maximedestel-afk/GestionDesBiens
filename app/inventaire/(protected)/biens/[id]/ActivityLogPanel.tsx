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
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-[#1d1d1f]">Historique des modifications</h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-[#6e6e73]">Aucune modification enregistrée.</p>
      ) : (
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-2">
              <div>
                <span className="font-medium text-[#1d1d1f]">{ACTION_LABELS[entry.action]}</span>{" "}
                <span className="text-[#6e6e73]">{entry.summary}</span>
                {entry.actorEmail && <span className="text-black/35"> — {entry.actorEmail}</span>}
              </div>
              <span className="whitespace-nowrap text-xs text-black/35">{formatDate(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
