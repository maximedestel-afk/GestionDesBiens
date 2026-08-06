import Link from "next/link";
import NewLeaseForm from "./NewLeaseForm";

export default function NewLeasePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
        ← Retour aux dossiers
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-semibold text-slate-900">Nouveau dossier de bail</h1>
      <NewLeaseForm />
    </main>
  );
}
