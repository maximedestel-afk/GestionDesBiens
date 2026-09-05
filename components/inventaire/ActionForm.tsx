"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";

export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<void>;
  children: (state: { pending: boolean; error: string | null; success: boolean }) => ReactNode;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await action(formData);
        setSuccess(true);
        if (resetOnSuccess) form.reset();
        onSuccess?.();
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children({ pending, error, success })}
    </form>
  );
}
