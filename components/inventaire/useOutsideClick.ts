"use client";

import { useEffect, type RefObject } from "react";

/** Ferme un menu déroulant (ou autre popover) au clic en dehors de `ref`. */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutsideClick: () => void,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [active, onOutsideClick, ref]);
}
