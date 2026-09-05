import { redirect, unstable_rethrow } from "next/navigation";
import { signIn } from "@/lib/inventaire/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  async function action(formData: FormData) {
    "use server";
    try {
      await signIn(formData);
    } catch (err) {
      unstable_rethrow(err);
      const message = err instanceof Error ? err.message : "Erreur de connexion.";
      redirect(`/inventaire/login?error=${encodeURIComponent(message)}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Melvane Gestion des Biens</h1>
        <p className="mt-1 text-sm text-slate-500">Connectez-vous pour accéder à l&apos;inventaire.</p>

        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? "/inventaire"} />
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
