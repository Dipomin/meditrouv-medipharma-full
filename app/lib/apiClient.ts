/**
 * Cœur HTTP partagé (source unique pour tous les appels réseau).
 *
 * - expiration systématique des requêtes (AbortController, 15 s) ;
 * - erreurs typées `ApiError` distinguant réseau, expiration, HTTP,
 *   404, réponse vide et JSON invalide (plus d'échec silencieux) ;
 * - corps d'erreur serveur tronqué et uniquement journalisé en dev ;
 * - déballage de l'enveloppe `{ data }` quand elle est présente.
 */

import { ApiError, toHttpError } from "./httpErrors";
import { logger } from "./logger";
import { OFFLINE_MESSAGE, ensureOnline } from "./offline";

export { ApiError } from "./httpErrors";
export type { ApiErrorKind, ApiErrorOptions } from "./httpErrors";

export const REQUEST_TIMEOUT_MS = 15000;

const parseJsonBody = <T>(text: string, url: string): T => {
  try {
    const data = JSON.parse(text) as unknown;
    if (data !== null && typeof data === "object" && "data" in data) {
      return (data as { data: T }).data;
    }
    return data as T;
  } catch (error) {
    logger.debug(
      `Réponse non-JSON de ${url} : ${text.substring(0, 200)}`,
      error
    );
    throw new ApiError("Réponse du serveur illisible (JSON invalide).", {
      kind: "parse",
    });
  }
};

const request = async <T>(url: string, options: RequestInit): Promise<T> => {
  if (!(await ensureOnline())) {
    throw new ApiError(OFFLINE_MESSAGE, { kind: "network" });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    logger.debug(`Appel API : ${options.method ?? "GET"} ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...((options.headers as Record<string, string> | undefined) ?? {}),
      },
      signal: controller.signal,
    });

    // Corps lu une fois (consommable unique) : il porte le message
    // d'erreur explicite du serveur en cas d'échec (`{ "error" }`).
    const text = await response.text();
    if (!response.ok) {
      throw toHttpError(response.status, text);
    }

    if (text.trim() === "") {
      throw new ApiError("Réponse vide du serveur.", { kind: "empty" });
    }
    return parseJsonBody<T>(text, url);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        "Le serveur met trop longtemps à répondre (délai dépassé).",
        { kind: "timeout" }
      );
    }
    throw new ApiError(OFFLINE_MESSAGE, { kind: "network" });
  } finally {
    clearTimeout(timer);
  }
};

export const getJson = <T>(url: string): Promise<T> =>
  request<T>(url, { method: "GET" });

export const postJson = <T>(url: string, body: unknown): Promise<T> =>
  request<T>(url, { method: "POST", body: JSON.stringify(body) });

export const putJson = <T>(url: string, body: unknown): Promise<T> =>
  request<T>(url, { method: "PUT", body: JSON.stringify(body) });

export const deleteJson = <T>(url: string): Promise<T> =>
  request<T>(url, { method: "DELETE" });

export const patchJson = <T>(url: string, body: unknown): Promise<T> =>
  request<T>(url, { method: "PATCH", body: JSON.stringify(body) });

// Variantes authentifiées (Medipharma) : la session pharmacien transite
// dans le header `x-pharmacien-id`, vérifié côté serveur.
export const authHeaders = (pharmacienId: string): Record<string, string> => ({
  "x-pharmacien-id": pharmacienId,
});

export const getJsonAuth = <T>(url: string, pharmacienId: string): Promise<T> =>
  request<T>(url, { method: "GET", headers: authHeaders(pharmacienId) });

export const postJsonAuth = <T>(
  url: string,
  body: unknown,
  pharmacienId: string
): Promise<T> =>
  request<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: authHeaders(pharmacienId),
  });

export const patchJsonAuth = <T>(
  url: string,
  body: unknown,
  pharmacienId: string
): Promise<T> =>
  request<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: authHeaders(pharmacienId),
  });

export const deleteJsonAuth = <T>(
  url: string,
  pharmacienId: string
): Promise<T> =>
  request<T>(url, { method: "DELETE", headers: authHeaders(pharmacienId) });

export default {
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
  getJsonAuth,
  postJsonAuth,
  patchJsonAuth,
  deleteJsonAuth,
  ApiError,
};
