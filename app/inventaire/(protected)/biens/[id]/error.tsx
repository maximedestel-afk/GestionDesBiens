"use client";

import { useEffect } from "react";

export default function PropertyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Une erreur est survenue</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-red-700">{error.message}</p>
      {error.digest && <p className="mt-1 text-xs text-red-500">Digest : {error.digest}</p>}
      {error.stack && (
        <pre className="mt-3 max-h-64 overflow-auto rounded bg-white p-3 text-xs text-[#6e6e73]">
          {error.stack}
        </pre>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 btn-primary"
      >
        Réessayer
      </button>
    </div>
  );
}
