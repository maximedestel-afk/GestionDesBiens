import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnerSessionEmail } from "@/lib/inventaire/ownerAuth";
import { listOwnerProperties } from "@/lib/inventaire/ownerActions";
import { OwnerEmailForm } from "./OwnerEmailForm";
import { OwnerLogoutButton } from "./OwnerLogoutButton";

export default async function OwnerHomePage() {
  const email = await getOwnerSessionEmail();

  if (!email) {
    return (
      <div className="mx-auto max-w-[420px] px-4 py-12">
        <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Espace propriétaire</h1>
        <p className="mt-1.5 text-[15px] text-[#6e6e73]">
          Renseignez l&apos;adresse email associée à votre bien pour compléter ou mettre à jour vos informations.
        </p>
        <OwnerEmailForm />
      </div>
    );
  }

  const properties = await listOwnerProperties(email);

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-[420px] px-4 py-12">
        <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Espace propriétaire</h1>
        <p className="mt-3 text-[15px] text-[#6e6e73]">
          Aucun bien n&apos;est associé à l&apos;adresse <strong>{email}</strong> pour le moment. Contactez votre
          gestionnaire si cela ne vous semble pas normal.
        </p>
        <div className="mt-4">
          <OwnerLogoutButton />
        </div>
      </div>
    );
  }

  if (properties.length === 1) {
    redirect(`/inventaire/proprietaire/${properties[0].propertyId}`);
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-12">
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Vos biens</h1>
      <p className="mt-1.5 text-[15px] text-[#6e6e73]">Choisissez le bien à compléter.</p>
      <ul className="mt-6 divide-y divide-black/[0.06] overflow-hidden rounded-[10px] border border-black/[0.06] bg-white">
        {properties.map((p) => (
          <li key={p.propertyId}>
            <Link
              href={`/inventaire/proprietaire/${p.propertyId}`}
              className="flex flex-col px-4 py-3 hover:bg-black/[0.02]"
            >
              <span className="text-[15px] font-medium text-[#1d1d1f]">{p.reference}</span>
              {p.name && <span className="text-[13px] text-[#6e6e73]">{p.name}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <OwnerLogoutButton />
      </div>
    </div>
  );
}
