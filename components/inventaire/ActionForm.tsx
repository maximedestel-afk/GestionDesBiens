"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Empêche deux enregistrements de partir en parallèle : sans ça, un envoi
  // plus ancien (avant une suppression de texte) peut se terminer après un
  // envoi plus récent et écraser la modification avec la valeur périmée —
  // le champ "revient tout seul" en arrière. Pendant un envoi en cours, on
  // mémorise juste le <form> le plus récent et on le renvoie dès que l'envoi
  // précédent est terminé, avec les valeurs les plus à jour du DOM.
  const submittingRef = useRef(false);
  const pendingFormRef = useRef<HTMLFormElement | null>(null);
  // Vrai tant qu'une modification n'a pas encore été envoyée (le débounce
  // n'a pas fini son délai). Permet de forcer l'envoi immédiat si l'utilisateur
  // quitte le champ ou rafraîchit la page avant la fin du délai normal, pour
  // éviter de perdre la saisie.
  const dirtyRef = useRef(false);

  const submit = (form: HTMLFormElement) => {
    if (submittingRef.current) {
      pendingFormRef.current = form;
      return;
    }
    submittingRef.current = true;
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
      } finally {
        submittingRef.current = false;
        const nextForm = pendingFormRef.current;
        if (nextForm) {
          pendingFormRef.current = null;
          submit(nextForm);
        }
      }
    });
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    dirtyRef.current = false;
    submit(event.currentTarget);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    if (!autoSave) return;
    const form = event.currentTarget;
    dirtyRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dirtyRef.current = false;
      submit(form);
    }, AUTO_SAVE_DEBOUNCE_MS);
  }

  function flushPending(form: HTMLFormElement) {
    if (!dirtyRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    dirtyRef.current = false;
    submit(form);
  }

  // Enregistre immédiatement (sans attendre le débounce) dès qu'un champ
  // perd le focus, pour réduire le risque de perdre une saisie si
  // l'utilisateur rafraîchit la page juste après.
  function handleBlur(event: FormEvent<HTMLFormElement>) {
    if (!autoSave) return;
    flushPending(event.currentTarget);
  }

  const flushPendingRef = useRef(flushPending);
  useEffect(() => {
    flushPendingRef.current = flushPending;
  });

  useEffect(() => {
    if (!autoSave) return;
    function handleUnload() {
      if (formRef.current) flushPendingRef.current(formRef.current);
    }
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [autoSave]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={handleChange} onBlur={handleBlur} className={className}>
      {children({ pending, error, success })}
    </form>
  );
}
