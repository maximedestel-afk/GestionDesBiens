import { getCurrentProfile } from "@/lib/inventaire/queries";
import { CSV_FIELDS } from "@/lib/inventaire/csvFields";
import { ImportPropertiesForm } from "./ImportPropertiesForm";

const ALL_COLUMNS = Object.values(CSV_FIELDS)
  .map((f) => f.header)
  .join(", ");

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
          Une ligne par bien. Seule la colonne « Reference » est obligatoire (elle sert de clé : un bien dont la
          référence existe déjà est mis à jour, pas de doublon créé ; sinon il est créé avec la liste d&apos;inventaire
          standard, comme un bien créé manuellement). Toutes les autres colonnes sont facultatives et dans
          n&apos;importe quel ordre : n&apos;incluez que celles que vous voulez renseigner — une colonne absente du
          fichier n&apos;efface rien, une colonne présente mais vide efface le champ.
        </p>
        <p className="mt-2 text-[13px] text-[#6e6e73]">
          Le nom exact de chaque colonne est aussi affiché au survol du petit
          <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/[0.06] align-middle text-[10px] font-medium text-[#6e6e73]">
            #
          </span>
          à côté de chaque champ dans les fiches bien — cliquer dessus le copie directement.
        </p>
        <p className="mt-2 text-[13px] text-[#6e6e73]">Colonnes reconnues : {ALL_COLUMNS}.</p>
      </div>

      <div className="mt-4 card p-5">
        <ImportPropertiesForm />
      </div>
    </div>
  );
}
