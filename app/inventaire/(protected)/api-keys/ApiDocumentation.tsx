const codeClass = "block overflow-x-auto rounded-[10px] bg-[#1d1d1f] px-3.5 py-2.5 text-[13px] text-white";

function Endpoint({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <li className="flex flex-col gap-0.5 border-b border-black/[0.06] py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="w-16 shrink-0 text-[12px] font-semibold text-[#0071e3]">{method}</span>
      <code className="text-[13px] text-[#1d1d1f]">{path}</code>
      <span className="text-[13px] text-[#6e6e73]">{description}</span>
    </li>
  );
}

export function ApiDocumentation() {
  return (
    <div className="mt-3 space-y-4 text-[14px] text-[#1d1d1f]">
      <p className="text-[13px] text-[#6e6e73]">
        API en lecture seule : le programme externe peut consulter les données mais ne peut rien modifier.
      </p>

      <div>
        <p className="font-medium">Authentification</p>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Chaque requête doit inclure la clé API dans l&apos;en-tête <code>Authorization</code> :
        </p>
        <code className={`mt-2 ${codeClass}`}>Authorization: Bearer mgb_live_...</code>
      </div>

      <div>
        <p className="font-medium">Exemple</p>
        <pre className={`mt-2 whitespace-pre-wrap ${codeClass}`}>
{`curl https://<votre-domaine>/api/v1/properties \\
  -H "Authorization: Bearer mgb_live_..."`}
        </pre>
      </div>

      <div>
        <p className="font-medium">Endpoints</p>
        <ul className="mt-1">
          <Endpoint method="GET" path="/api/v1/properties" description="Liste des biens." />
          <Endpoint
            method="GET"
            path="/api/v1/properties/:id"
            description="Détail complet d'un bien (propriétaire, agencement, clés, plateformes, équipements, inventaire, tâches, prestataire ménage…)."
          />
          <Endpoint method="GET" path="/api/v1/properties/:id/tasks" description="Liste des tâches d'un bien." />
          <Endpoint method="GET" path="/api/v1/cleaning-providers" description="Liste des prestataires ménage." />
        </ul>
      </div>

      <p className="text-[12px] text-black/35">
        D&apos;autres données, ou la possibilité de modifier des données depuis l&apos;extérieur, peuvent être
        ajoutées à l&apos;API sur demande.
      </p>
    </div>
  );
}
