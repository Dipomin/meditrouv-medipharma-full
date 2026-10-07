/**
 * Gestion hors-connexion : classification des erreurs réseau (pure,
 * testable en Node) et garde d'accès réseau avant les appels API.
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

/** Message affiché quand l'appareil est hors connexion. */
export const OFFLINE_MESSAGE =
  "Hors connexion. Vérifiez votre connexion puis réessayez.";

const NATIVE_NETWORK_PATTERN =
  /network request failed|fetch failed|network error|timeout|abort|offline|connexion impossible/i;

/**
 * Vrai si l'erreur traduit un problème réseau (pas de connexion,
 * serveur injoignable, délai dépassé). Reconnaît les `ApiError`
 * typées (`kind: network/timeout`) et les erreurs fetch natives.
 */
export const isOfflineError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  if ("kind" in error) {
    const kind = (error as { kind?: unknown }).kind;
    return kind === "network" || kind === "timeout";
  }
  if (error instanceof Error) {
    return NATIVE_NETWORK_PATTERN.test(error.message);
  }
  return false;
};

/** Message d'erreur adapté : offline si réseau, sinon le repli fourni. */
export const offlineAwareMessage = (error: unknown, fallback: string): string =>
  isOfflineError(error) ? OFFLINE_MESSAGE : fallback;

/**
 * Vrai si l'appareil semble en ligne. Retourne vrai par défaut
 * (état inconnu) : le serveur répondra avec une erreur mappée sinon.
 * Import dynamique pour rester importable dans les tests Node.
 */
export const ensureOnline = async (): Promise<boolean> => {
  try {
    const NetInfo = (await import("@react-native-community/netinfo")).default;
    const state = await NetInfo.fetch();
    return state.isConnected !== false;
  } catch {
    return true;
  }
};
