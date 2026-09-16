import { getCurrentProfile, getLeaseTemplateInfo } from "@/lib/inventaire/queries";
import { LeaseTemplateUploadForm } from "./LeaseTemplateUploadForm";

export default async function BailTypePage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const template = await getLeaseTemplateInfo();

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

      <div className="mt-4">
        <LeaseTemplateUploadForm />
      </div>
    </div>
  );
}
