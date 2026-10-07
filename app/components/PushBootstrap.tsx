/**
 * Amorçage push (sans UI) : enregistrement du jeton Expo à la connexion,
 * écouteurs d'alerte (son + deep-link) et tap initial à froid.
 * No-op complet si le push est indisponible (module absent, web, refus).
 */

import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { usePharmacienAuth } from "../context/PharmacienAuthContext";
import { pushAPI } from "../lib/api";
import { logger } from "../lib/logger";
import {
  getInitialPushTap,
  registerForPushAsync,
  setupPushListeners,
} from "../lib/push";

// Dernier jeton enregistré (désinscription à la déconnexion).
let dernierJeton: string | null = null;

/** Désinscrit l'appareil du push (à appeler à la déconnexion). */
export const unregisterPushOnLogout = async (
  pharmacienId: string
): Promise<void> => {
  if (!dernierJeton) {
    return;
  }
  const jeton = dernierJeton;
  dernierJeton = null;
  await pushAPI.unregister(pharmacienId, jeton);
};

export default function PushBootstrap() {
  const router = useRouter();
  const { pharmacien } = usePharmacienAuth();
  const pharmacienId = pharmacien?.id;
  const tapInitialLu = useRef(false);

  useEffect(() => {
    if (!pharmacienId) {
      return;
    }
    let cancelled = false;
    registerForPushAsync()
      .then((token) => {
        if (cancelled || !token || !pharmacienId) {
          return;
        }
        dernierJeton = token;
        return pushAPI
          .register(pharmacienId, token, Platform.OS)
          .catch((error: unknown) => {
            logger.warn("Enregistrement push impossible.", error);
          });
      })
      .catch((error: unknown) => {
        logger.warn("Push indisponible.", error);
      });
    const cleanup = setupPushListeners((data) => {
      if (data.demandeId) {
        router.push(`/demande-details/${data.demandeId}`);
      }
    });
    if (!tapInitialLu.current) {
      tapInitialLu.current = true;
      getInitialPushTap()
        .then((data) => {
          if (!cancelled && data?.demandeId) {
            router.push(`/demande-details/${data.demandeId}`);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pharmacienId, router]);

  return null;
}
