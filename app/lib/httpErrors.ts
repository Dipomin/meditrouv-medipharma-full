/**
 * Erreurs HTTP typées (source unique, sans dépendance).
 *
 * Volontairement sans import : importable tel quel sous Node pour les
 * tests unitaires (`__tests__/httpErrors.test.ts`), sans dépendance
 * native. `apiClient` ré-exporte `ApiError` et utilise ces fonctions.
 */

export type ApiErrorKind =
  | "network"
  | "timeout"
  | "http"
  | "not-found"
  | "parse"
  | "empty";

export type ApiErrorOptions = {
  kind: ApiErrorKind;
  status?: number;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
  }
}

/** Longueur max d'un message d'erreur serveur affiché (garde-fou). */
export const MAX_SERVER_ERROR_LENGTH = 200;

/**
 * Extrait le message explicite du serveur (`{ "error": "..." }`).
 * Retourne null si le corps n'est pas un JSON d'erreur exploitable
 * (page HTML, vide, invalide) : l'appelant utilise alors son repli.
 */
export const extractServerError = (bodyText: string): string | null => {
  const text = bodyText.trim();
  if (!text.startsWith("{")) {
    return null;
  }
  try {
    const data: unknown = JSON.parse(text);
    if (data !== null && typeof data === "object" && "error" in data) {
      const message = (data as { error: unknown }).error;
      if (typeof message === "string" && message.trim() !== "") {
        return message.trim().substring(0, MAX_SERVER_ERROR_LENGTH);
      }
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Construit l'erreur typée d'un statut HTTP en échec, en préférant
 * le message explicite du serveur au message générique par statut.
 * `kind`/`status` inchangés (contrats existants préservés).
 */
export const toHttpError = (status: number, bodyText: string): ApiError => {
  const serverMessage = extractServerError(bodyText);
  if (status === 404) {
    return new ApiError(serverMessage ?? "Ressource introuvable (404).", {
      kind: "not-found",
      status: 404,
    });
  }
  if (status === 401) {
    return new ApiError(
      serverMessage ?? "Session expirée. Veuillez vous reconnecter.",
      { kind: "http", status: 401 }
    );
  }
  if (status === 403) {
    return new ApiError(serverMessage ?? "Accès refusé.", {
      kind: "http",
      status: 403,
    });
  }
  return new ApiError(
    serverMessage ?? `Erreur du serveur (${status}). Veuillez réessayer.`,
    { kind: "http", status }
  );
};
