"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { unstable_rethrow } from "next/navigation";

const AUTO_SAVE_DEBOUNCE_MS = 800;

export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
  autoSave = false,
}: {
  action: (formData: FormData) => Promise<void>;
  children: (state: { pending: boolean; error: string | null; success: boolean }) => ReactNode;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
  /** Enregistre automatiquement (débounce) à chaque changement de champ, sans bouton. */
  autoSave?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submit = useCallback(
    (form: HTMLFormElement) => {
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
    },
    [action, onSuccess, resetOnSuccess]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    submit(event.currentTarget);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    if (!autoSave) return;
    const form = event.currentTarget;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => submit(form), AUTO_SAVE_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} onChange={handleChange} className={className}>
      {children({ pending, error, success })}
    </form>
  );
}
