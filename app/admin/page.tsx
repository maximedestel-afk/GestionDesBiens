import Link from "next/link";
import { getLeaseFields, listLeases } from "@/lib/db";

export const dynamic = "force-dynamic";

function statusBadge(submittedAt: string | null, filled: number, total: number) {
  if (submittedAt) {
    return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Transmis</span>;
  }
  if (total > 0 && filled > 0) {
    return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">En cours ({filled}/{total})</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">En attente du client</span>;
}

export default function AdminHomePage() {
  const leases = listLeases().map((lease) => {
    const fields = getLeaseFields(lease.id);
    const clientFields = fields.filter((f) => f.assigned_to === "client");
    const filled = clientFields.filter((f) => f.value && f.value.trim() !== "").length;
    return { lease, total: clientFields.length, filled };
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dossiers de bail</h1>
          <p className="mt-1 text-sm text-slate-500">
            Créez un dossier par client, choisissez les champs qu&apos;il devra compléter, puis
            envoyez-lui son lien personnel.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nouveau dossier
        </Link>
      </div>

      {leases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucun dossier pour l&apos;instant. Créez-en un pour commencer.
        </div>
      ) : (
        <ul className="space-y-3">
          {leases.map(({ lease, total, filled }) => (
            <li key={lease.id}>
              <Link
                href={`/admin/leases/${lease.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div>
                  <p className="font-medium text-slate-900">{lease.client_name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Créé le {new Date(lease.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {statusBadge(lease.submitted_at, filled, total)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
