import { Fragment } from "react";
import { getCurrentProfile, listAllProfilePropertyAssignments, listProfiles, listProperties } from "@/lib/inventaire/queries";
import { RoleSelect } from "@/components/inventaire/RoleSelect";
import { InviteUserForm } from "./InviteUserForm";
import { CreateUserForm } from "./CreateUserForm";
import { UserActions } from "./UserActions";
import { PrestataireAccessEditor } from "./PrestataireAccessEditor";

export default async function UsersPage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const [profiles, properties, propertyAssignments] = await Promise.all([
    listProfiles(),
    listProperties(),
    listAllProfilePropertyAssignments(),
  ]);

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Utilisateurs</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Gérez les rôles de l&apos;équipe (admin / ménage) et invitez de nouveaux membres.
      </p>

      <div className="mt-6 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Créer directement</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Compte utilisable immédiatement avec l&apos;email et le mot de passe choisis.
        </p>
        <div className="mt-3">
          <CreateUserForm properties={properties} />
        </div>
      </div>

      <div className="mt-4 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Inviter par email</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Envoie un email pour que la personne choisisse elle-même son mot de passe.
        </p>
        <div className="mt-3">
          <InviteUserForm properties={properties} />
        </div>
      </div>

      <div className="mt-6 overflow-visible card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-left text-xs uppercase tracking-wide text-black/35">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Rôle</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-b border-black/[0.06] last:border-0">
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">{p.fullName ?? "—"}</td>
                  <td className="px-4 py-2">
                    <RoleSelect userId={p.id} role={p.role} />
                  </td>
                  <td className="px-4 py-2">
                    <UserActions userId={p.id} email={p.email} isSelf={p.id === profile?.id} />
                  </td>
                </tr>
                {p.role === "prestataire" && (
                  <tr className="border-b border-black/[0.06] bg-black/[0.015] last:border-0">
                    <td colSpan={4} className="px-4 py-3">
                      <p className="mb-1 text-[12px] font-medium text-[#6e6e73]">Accès de {p.email}</p>
                      <PrestataireAccessEditor
                        userId={p.id}
                        properties={properties}
                        propertyIds={propertyAssignments[p.id] ?? []}
                        allowedTabs={p.allowedTabs}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
