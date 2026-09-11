"use client";

import Link from "next/link";
import type { JournalEntry } from "@/lib/inventaire/queries";
import type { ActivityLogEntry } from "@/lib/inventaire/types";

const ACTION_LABELS: Record<ActivityLogEntry["action"], string> = {
  create: "Ajout",
  update: "Modification",
  delete: "Suppression",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function JournalList({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return <p className="p-8 text-center text-[15px] text-[#6e6e73]">Aucune modification sur cette période.</p>;
  }

  return (
    <ul className="divide-y divide-black/[0.06]">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
          <div className="min-w-0">
            <Link
              href={`/inventaire/biens/${entry.propertyId}`}
              className="font-semibold text-[#1d1d1f] hover:underline"
            >
              {entry.propertyReference}
            </Link>
            {entry.propertyName && <span className="ml-1.5 text-[#6e6e73]">{entry.propertyName}</span>}
            <div>
              <span className="font-medium text-[#1d1d1f]">{ACTION_LABELS[entry.action]}</span>{" "}
              <span className="text-[#6e6e73]">{entry.summary}</span>
              {entry.actorEmail && <span className="text-black/35"> — {entry.actorEmail}</span>}
            </div>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-black/35">{formatDate(entry.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
