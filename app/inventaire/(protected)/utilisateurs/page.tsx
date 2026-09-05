import { getCurrentProfile, listProfiles } from "@/lib/inventaire/queries";
import { RoleSelect } from "@/components/inventaire/RoleSelect";
import { InviteUserForm } from "./InviteUserForm";

export default async function UsersPage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    return <p className="text-sm text-slate-500">Réservé aux administrateurs.</p>;
  }

  const profiles = await listProfiles();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Utilisateurs</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gérez les rôles de l&apos;équipe (admin / ménage) et invitez de nouveaux membres.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <InviteUserForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{p.email}</td>
                <td className="px-4 py-2">{p.fullName ?? "—"}</td>
                <td className="px-4 py-2">
                  <RoleSelect userId={p.id} role={p.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
