/**
 * Session pharmacien (source unique) : profil persisté + rafraîchissement
 * serveur. Les écrans consomment ce hook (ou le contexte) et redirigent
 * vers /auth quand la session est absente.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { usePharmacienAuth } from "../context/PharmacienAuthContext";
import { pharmacienAPI } from "./api";
import { logger } from "./logger";
import type { Pharmacien } from "./types";

export const usePharmacienSession = (): {
  pharmacien: Pharmacien | null;
  isReady: boolean;
  refresh: () => Promise<void>;
} => {
  const { pharmacien, isLoading, updatePharmacien } = usePharmacienAuth();
  const [isReady, setIsReady] = useState(false);
  const refreshedId = useRef<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!pharmacien) {
      return;
    }
    try {
      const fresh = await pharmacienAPI.me(pharmacien.id);
      await updatePharmacien(fresh);
    } catch (error) {
      // Hors-ligne ou session expirée : garder le profil local.
      logger.warn("Rafraîchissement du profil impossible.", error);
    }
  }, [pharmacien, updatePharmacien]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    let cancelled = false;
    // Rafraîchissement unique par session, puis bascule `isReady` dans
    // la continuation async (pas de setState synchrone dans l'effet).
    const init = async (): Promise<void> => {
      if (pharmacien && refreshedId.current !== pharmacien.id) {
        refreshedId.current = pharmacien.id;
        await refresh();
      }
      if (!cancelled) {
        setIsReady(true);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [isLoading, pharmacien, refresh]);

  return { pharmacien, isReady, refresh };
};
