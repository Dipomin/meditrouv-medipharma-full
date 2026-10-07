/**
 * Compteur de notifications non lues avec sondage périodique (pastille du
 * menu). Intervalle 60 s, pause quand l'écran est masqué via `enabled`.
 */

import { useCallback, useEffect, useState } from "react";

import { notificationsAPI } from "./api";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 60_000;

export const useUnreadCount = (
  pharmacienId: string | null | undefined,
  pharmacieId: string | null | undefined,
  enabled = true
): { unread: number; refresh: () => Promise<void> } => {
  const [unread, setUnread] = useState(0);

  // Pur : ne touche pas l'état (les mises à jour ont lieu dans les
  // callbacks de promesse, jamais en synchrone dans l'effet).
  const fetchCount = useCallback(async (): Promise<number> => {
    if (!pharmacienId || !pharmacieId) {
      return 0;
    }
    return notificationsAPI.unreadCount(pharmacienId, pharmacieId);
  }, [pharmacienId, pharmacieId]);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setUnread(await fetchCount());
    } catch (error) {
      logger.warn("Compteur de notifications inaccessible.", error);
    }
  }, [fetchCount]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    const poll = (): void => {
      fetchCount()
        .then((count) => {
          if (!cancelled) {
            setUnread(count);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            logger.warn("Compteur de notifications inaccessible.", error);
          }
        });
    };
    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, fetchCount]);

  return { unread, refresh };
};
