import { notFound } from "next/navigation";
import { getLeaseByToken, getLeaseFields } from "@/lib/db";
import { serializeField, serializeLease } from "@/lib/serialize";
import ClientForm from "./ClientForm";

export const dynamic = "force-dynamic";

export default async function ClientFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const leaseRow = getLeaseByToken(token);
  if (!leaseRow) notFound();

  const fields = getLeaseFields(leaseRow.id)
    .filter((f) => f.assigned_to === "client")
    .map(serializeField);
  const lease = serializeLease(leaseRow);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Bonjour {lease.clientName}</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        Merci de compléter les informations demandées ci-dessous pour la préparation de votre contrat de
        location meublée.
      </p>
      <ClientForm token={token} lease={lease} fields={fields} />
    </main>
  );
}
