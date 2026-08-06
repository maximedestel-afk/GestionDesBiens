import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeaseFields, getLeaseRow } from "@/lib/db";
import { serializeField, serializeLease } from "@/lib/serialize";
import LeaseEditor from "./LeaseEditor";
import EditableClientName from "./EditableClientName";

export const dynamic = "force-dynamic";

export default async function LeaseConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leaseRow = getLeaseRow(id);
  if (!leaseRow) notFound();

  const fields = getLeaseFields(id).map(serializeField);
  const lease = serializeLease(leaseRow);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
        ← Retour aux dossiers
      </Link>
      <div className="mt-3 mb-8">
        <EditableClientName leaseId={id} initialName={lease.clientName} />
        <p className="mt-1 text-sm text-slate-500">
          Choisissez pour chaque champ du bail qui doit le compléter, puis envoyez le lien au client.
        </p>
      </div>
      <LeaseEditor lease={lease} fields={fields} />
    </main>
  );
}
