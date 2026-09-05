export function SaveStatus({
  pending,
  error,
  success,
}: {
  pending: boolean;
  error: string | null;
  success: boolean;
}) {
  return (
    <div className="flex h-5 items-center text-[13px]">
      {pending && <span className="text-black/40">Enregistrement…</span>}
      {!pending && success && <span className="text-emerald-600">Enregistré ✓</span>}
      {!pending && error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
