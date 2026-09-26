import { Fragment } from "react";
import {
  getAllowedSectionsForRole,
  getCurrentProfile,
  listAllProfilePropertyAssignments,
  listProfiles,
  listProperties,
  listRolePermissions,
} from "@/lib/inventaire/queries";
import { canAccessSection } from "@/lib/inventaire/tabs";
import type { UserRole } from "@/lib/inventaire/types";
import { RoleSelect } from "@/components/inventaire/RoleSelect";
import { FullNameEditor } from "@/components/inventaire/FullNameEditor";
import { InviteUserForm } from "./InviteUserForm";
import { CreateUserForm } from "./CreateUserForm";
import { UserActions } from "./UserActions";
import { PrestataireAccessEditor } from "./PrestataireAccessEditor";
import { RolePermissionsEditor } from "./RolePermissionsEditor";

const NON_ADMIN_ROLES: { role: UserRole; label: string }[] = [
  { role: "operations", label: "Operations" },
  { role: "manager", label: "Manager" },
  { role: "menage", label: "Ménage" },
  { role: "prestataire", label: "Prestataire" },
];

export default async function UsersPage() {
  const profile = await getCurrentProfile();
  const allowedSections = await getAllowedSectionsForRole(profile?.role);

  if (!canAccessSection(profile?.role, allowedSections, "menu_utilisateurs")) {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const [profiles, properties, propertyAssignments, rolePermissions] = await Promise.all([
    listProfiles(),
    listProperties(),
    listAllProfilePropertyAssignments(),
    listRolePermissions(),
  ]);

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Utilisateurs</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Gérez les rôles de l&apos;équipe (admin / ménage) et invitez de nouveaux membres.
      </p>

      <div className="mt-6 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Autorisations par rôle</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Pour chaque rôle : quels onglets de bien et items du menu du haut (Utilisateurs, Bail type,
          Accès…) sont visibles (vide = rien de restreint), et le niveau d&apos;accréditation (lecture
          seule / lecture + écriture / lecture + écriture + suppression) sur tout ce que le rôle peut voir.
          Partagé par tous les utilisateurs du rôle. Admin voit et peut toujours tout.
        </p>
        <div className="mt-3 space-y-3">
          {NON_ADMIN_ROLES.map(({ role, label }) => (
            <div key={role}>
              <p className="mb-1 text-[12px] font-medium text-[#6e6e73]">{label}</p>
              <RolePermissionsEditor
                role={role}
                allowedTabs={rolePermissions[role]?.allowedTabs ?? []}
                permissionLevel={rolePermissions[role]?.permissionLevel ?? (role === "prestataire" ? "read" : "write")}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 card p-5">
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
                  <td className="px-4 py-2">
                    <FullNameEditor userId={p.id} fullName={p.fullName} />
                  </td>
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
                      <p className="mb-1 text-[12px] font-medium text-[#6e6e73]">Biens accessibles à {p.email}</p>
                      <PrestataireAccessEditor
                        userId={p.id}
                        properties={properties}
                        propertyIds={propertyAssignments[p.id] ?? []}
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
