import { getCurrentProfile, listAllActivityLog } from "@/lib/inventaire/queries";
import { SinceFilter } from "./SinceFilter";
import { JournalList } from "./JournalList";

function defaultSince(): string {
  return new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const { since } = await searchParams;
  const sinceIso = since || defaultSince();

  const entries = await listAllActivityLog(sinceIso);

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Journal des modifications</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Toutes les actions enregistrées sur l&apos;ensemble des biens, les plus récentes en premier.
      </p>

      <div className="mt-5">
        <SinceFilter defaultSinceIso={sinceIso} />
      </div>

      <div className="mt-6 card overflow-visible">
        <JournalList entries={entries} />
      </div>
    </div>
  );
}
