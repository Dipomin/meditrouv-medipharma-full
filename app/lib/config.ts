/**
 * Configuration des URL d'API pour l'application.
 *
 * L'URL de base provient du module centralisé `env` (variable
 * `EXPO_PUBLIC_API_URL`, sinon repli de production). Les anciennes
 * variables `.env` sans préfixe n'étaient jamais injectées par Expo.
 */

import { ApiError, getJson } from "./apiClient";
import { ENV } from "./env";
import { logger } from "./logger";

// Liste des URL d'API possibles (failover : première URL saine utilisée).
export const API_URLS = [ENV.apiBaseUrl];

// URL d'API par défaut.
let currentApiUrl = API_URLS[0];

/**
 * Définit l'URL d'API à utiliser.
 * @param url URL d'API à utiliser
 */
export const setApiUrl = (url: string): void => {
  currentApiUrl = url;
};

/**
 * Récupère l'URL d'API actuelle.
 * @returns URL d'API actuelle
 */
export const getApiUrl = (): string => currentApiUrl;

/**
 * Teste la connexion à une URL d'API (avec expiration, plus de timeout commenté).
 * @param url URL d'API à tester
 * @returns Promise<boolean> true si la connexion est établie, false sinon
 */
export const testApiConnection = async (url: string): Promise<boolean> => {
  try {
    await getJson<unknown>(`${url.replace(/\/+$/, "")}/health`);
    return true;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error(`Échec du test de connexion à ${url}.`, error);
    }
    return false;
  }
};

/**
 * Teste la connexion à toutes les URL d'API disponibles
 * et définit la première URL fonctionnelle comme URL d'API actuelle.
 * @returns Promise<string|null> URL d'API fonctionnelle ou null si aucune URL ne fonctionne
 */
export const findWorkingApiUrl = async (): Promise<string | null> => {
  for (const url of API_URLS) {
    const isWorking = await testApiConnection(url);
    if (isWorking) {
      setApiUrl(url);
      logger.info(`URL d'API fonctionnelle trouvée: ${url}`);
      return url;
    }
  }

  logger.error("Aucune URL d'API fonctionnelle trouvée.");
  return null;
};

export default {
  API_URLS,
  getApiUrl,
  setApiUrl,
  testApiConnection,
  findWorkingApiUrl,
};
