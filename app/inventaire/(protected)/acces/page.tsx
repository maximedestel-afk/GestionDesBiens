import { getAppNotes, getCurrentProfile } from "@/lib/inventaire/queries";
import { AccesNotesForm } from "./AccesNotesForm";

export default async function AccesPage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const content = await getAppNotes();

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Accès</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Zone de notes libre pour les informations techniques de l&apos;équipe (codes, mots de passe
        Supabase, GitHub, etc.). Formatage possible (gras, italique, listes, titres…) via les boutons
        ou la syntaxe Markdown — bouton « Aperçu » pour voir le rendu.
      </p>

      <div className="mt-6">
        <AccesNotesForm content={content} />
      </div>
    </div>
  );
}
