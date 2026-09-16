import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getLeaseTemplateInfo } from "@/lib/inventaire/queries";
import { analyzeLeaseTemplateTags } from "@/lib/inventaire/leaseTemplate";
import { LeaseTemplateUploadForm } from "./LeaseTemplateUploadForm";

export default async function BailTypePage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const template = await getLeaseTemplateInfo();

  // Si un modèle personnalisé est déposé : combien de balises du système il
  // reconnaît réellement, pour repérer tout de suite une balise absente —
  // ou scindée en plusieurs morceaux par Word sans que ça se voie à l'oeil.
  let tagAnalysis: { found: string[]; missing: string[] } | null = null;
  if (template.filePath) {
    const supabase = await createClient();
    const { data: blob } = await supabase.storage.from("property-files").download(template.filePath);
    if (blob) {
      try {
        tagAnalysis = analyzeLeaseTemplateTags(Buffer.from(await blob.arrayBuffer()));
      } catch {
        tagAnalysis = null;
      }
    }
  }

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Bail type</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Modèle utilisé pour générer le bail rempli (bouton « Télécharger le bail rempli », onglet Bail de
        chaque bien). Le remplacer ici s&apos;applique immédiatement à tous les biens.
      </p>

      <div className="mt-6 card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Modèle actuellement utilisé</h2>
        {template.filePath ? (
          <div className="text-[14px] text-[#1d1d1f]">
            <p>
              <span className="font-medium">{template.originalFilename}</span>
              {template.downloadUrl && (
                <a href={template.downloadUrl} className="link-quiet ml-2 text-[13px]">
                  Télécharger
                </a>
              )}
            </p>
            <p className="mt-1 text-[13px] text-[#6e6e73]">
              Déposé{template.uploadedByEmail ? ` par ${template.uploadedByEmail}` : ""}
              {template.updatedAt &&
                ` le ${new Date(template.updatedAt).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}`}
            </p>
          </div>
        ) : (
          <p className="text-[14px] text-[#6e6e73]">
            Modèle par défaut fourni avec l&apos;application (aucun modèle personnalisé déposé).
          </p>
        )}
      </div>

      {tagAnalysis && (
        <div className="mt-4 card space-y-2 p-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Balises reconnues dans ce modèle</h2>
          <p className="text-[13px] text-[#6e6e73]">
            {tagAnalysis.found.length} sur {tagAnalysis.found.length + tagAnalysis.missing.length} balises du
            système sont détectées dans ce fichier et seront remplies automatiquement.
          </p>
          {tagAnalysis.missing.length > 0 && (
            <details className="text-[13px] text-[#6e6e73]">
              <summary className="cursor-pointer text-[#1d1d1f]">
                Balises absentes ou non détectées ({tagAnalysis.missing.length})
              </summary>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {tagAnalysis.missing.map((tag) => (
                  <li key={tag} className="rounded-full bg-black/[0.05] px-2.5 py-1 font-mono text-[12px]">
                    [{tag}]
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Si l&apos;une de ces balises est pourtant bien présente dans votre document, réessayez de la
                retaper d&apos;un seul geste, sans pause au milieu : Word la scinde parfois en plusieurs
                morceaux invisibles à l&apos;oeil (correcteur orthographique, mise en forme…) que la
                génération ne reconnaît alors plus.
              </p>
            </details>
          )}
        </div>
      )}

      <div className="mt-4">
        <LeaseTemplateUploadForm />
      </div>
    </div>
  );
}
