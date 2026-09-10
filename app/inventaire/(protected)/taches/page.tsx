import Link from "next/link";
import {
  getCurrentProfile,
  getPrestataireAllowedPropertyIds,
  listProfiles,
  listProperties,
  listTasksForProperties,
} from "@/lib/inventaire/queries";
import { NewTaskDialog } from "@/components/inventaire/NewTaskDialog";
import { TachesList } from "@/components/inventaire/TachesList";

export default async function TachesPage() {
  const profile = await getCurrentProfile();
  const isPrestataire = profile?.role === "prestataire";
  const allowedPropertyIds = isPrestataire ? await getPrestataireAllowedPropertyIds(profile!.id) : null;
  const properties = await listProperties(undefined, allowedPropertyIds);
  const propertyIds = properties.map((p) => p.id);
  const [tasksByProperty, profiles] = await Promise.all([
    listTasksForProperties(propertyIds),
    listProfiles(),
  ]);

  return (
    <div>
      <Link href="/inventaire" className="text-[13px] text-[#0071e3]">
        ← Tous les biens
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Tâches</h1>
        {!isPrestataire && <NewTaskDialog properties={properties} profiles={profiles} />}
      </div>

      <TachesList properties={properties} tasksByProperty={tasksByProperty} profiles={profiles} />
    </div>
  );
}
