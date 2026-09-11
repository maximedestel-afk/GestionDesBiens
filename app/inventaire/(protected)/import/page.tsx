import { getCurrentProfile } from "@/lib/inventaire/queries";
import { ImportPropertiesForm } from "./ImportPropertiesForm";

export default async function ImportPage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Importer des biens</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Créez ou mettez à jour plusieurs biens en une fois depuis un fichier CSV.
      </p>

      <div className="mt-6 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Format attendu</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Colonnes reconnues (l&apos;ordre n&apos;a pas d&apos;importance) : Reference, Nom, Adresse, Superficie,
          Capacité, Url AIRBNB, URL BOOKING, URL VRBO, URL Hopper, Nom Owner, Prénom Owner, Tel Owner, Email Owner.
        </p>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          La colonne « Reference » est obligatoire et sert de clé : un bien dont la référence existe déjà est mis à
          jour (pas de doublon créé) ; sinon il est créé avec la liste d&apos;inventaire standard, comme un bien créé
          manuellement.
        </p>
      </div>

      <div className="mt-4 card p-5">
        <ImportPropertiesForm />
      </div>
    </div>
  );
}
