import Link from "next/link";
import {
  getAllowedSectionsForRole,
  getCurrentProfile,
  getPrestataireAllowedPropertyIds,
  listAttachmentsForEntities,
  listProfiles,
  listProperties,
  listScheduledTasks,
} from "@/lib/inventaire/queries";
import { canAccessSection } from "@/lib/inventaire/tabs";
import { NewTaskDialog } from "@/components/inventaire/NewTaskDialog";
import { PlanningAgenda } from "@/components/inventaire/PlanningAgenda";

export default async function PlanningPage() {
  const profile = await getCurrentProfile();
  const allowedSections = await getAllowedSectionsForRole(profile?.role);
  if (!canAccessSection(profile?.role, allowedSections, "menu_planning")) {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }
  const isPrestataire = profile?.role === "prestataire";
  const allowedPropertyIds = isPrestataire ? await getPrestataireAllowedPropertyIds(profile!.id) : null;
  const properties = await listProperties(undefined, allowedPropertyIds);
  const propertyIds = properties.map((p) => p.id);
  const [tasks, profiles] = await Promise.all([listScheduledTasks(propertyIds), listProfiles()]);
  const attachments = await listAttachmentsForEntities(
    "task",
    tasks.map((t) => t.id)
  );

  return (
    <div>
      <Link href="/inventaire" className="text-[13px] text-[#0071e3]">
        ← Tous les biens
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Planning</h1>
        {!isPrestataire && <NewTaskDialog properties={properties} profiles={profiles} />}
      </div>
      <p className="mt-1 text-[13px] text-[#6e6e73]">
        Interventions planifiées sur les biens (installation, rendez-vous, réparation…), avec date et horaire.
      </p>

      <PlanningAgenda properties={properties} tasks={tasks} profiles={profiles} attachments={attachments} />
    </div>
  );
}
