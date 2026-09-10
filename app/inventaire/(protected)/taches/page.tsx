import Link from "next/link";
import {
  getCurrentProfile,
  getPrestataireAllowedPropertyIds,
  listProfiles,
  listProperties,
  listTasksForProperties,
} from "@/lib/inventaire/queries";
import { NewTaskDialog } from "@/components/inventaire/NewTaskDialog";
import { TaskCard } from "@/components/inventaire/TaskCard";

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

  const propertiesWithTasks = properties.filter((p) => (tasksByProperty[p.id] ?? []).length > 0);

  return (
    <div>
      <Link href="/inventaire" className="text-[13px] text-[#0071e3]">
        ← Tous les biens
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Tâches</h1>
        {!isPrestataire && <NewTaskDialog properties={properties} profiles={profiles} />}
      </div>

      {propertiesWithTasks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/15 p-6 text-[15px] text-[#6e6e73]">
          Aucune tâche pour le moment.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {propertiesWithTasks.map((property) => (
            <div key={property.id}>
              <Link
                href={`/inventaire/biens/${property.id}?tab=taches`}
                className="text-[15px] font-semibold text-[#1d1d1f] hover:text-[#0071e3]"
              >
                {property.reference}
                {property.name && <span className="ml-2 font-normal text-[#6e6e73]">{property.name}</span>}
              </Link>
              <div className="mt-3 space-y-3">
                {(tasksByProperty[property.id] ?? []).map((task) => (
                  <TaskCard key={task.id} propertyId={property.id} task={task} profiles={profiles} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
