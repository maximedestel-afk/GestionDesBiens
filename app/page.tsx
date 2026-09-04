import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-2xl font-semibold text-slate-900">Outils de gestion</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <h2 className="text-lg font-medium text-slate-900">Bail Meublé</h2>
            <p className="mt-1 text-sm text-slate-500">Dossiers clients et champs de contrat de location.</p>
          </Link>
          <Link
            href="/inventaire"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <h2 className="text-lg font-medium text-slate-900">Registre des biens</h2>
            <p className="mt-1 text-sm text-slate-500">Inventaire du parc de locations meublées.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
