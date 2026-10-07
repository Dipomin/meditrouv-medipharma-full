/**
 * Accès centralisé aux variables d'environnement.
 *
 * Sous Expo, seules les variables préfixées `EXPO_PUBLIC_` sont injectées
 * dans le bundle applicatif. Les anciennes lectures `process.env.X` sans
 * préfixe étaient donc silencieusement mortes (fallback systématique).
 * Chaque entrée ci-dessous lit la variable `EXPO_PUBLIC_*` avec un
 * repli explicite vers l'URL de production connue.
 */

const FALLBACK_API_BASE_URL = "https://meditrouv-admin.vercel.app/api";

// Accès statiques uniquement : Expo interdit l'accès dynamique à process.env
// (résolution au moment du bundle).
const nonEmpty = (value: string | undefined): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const apiBaseUrl =
  nonEmpty(process.env.EXPO_PUBLIC_API_URL) ?? FALLBACK_API_BASE_URL;

export const ENV = {
  apiBaseUrl,
  medicamentsApiUrl:
    nonEmpty(process.env.EXPO_PUBLIC_MEDICAMENTS_API_URL) ??
    joinUrl(apiBaseUrl, "medicaments"),
  pharmaciesApiUrl:
    nonEmpty(process.env.EXPO_PUBLIC_PHARMACIES_API_URL) ??
    joinUrl(apiBaseUrl, "pharmacies"),
  createUsersApiUrl:
    nonEmpty(process.env.EXPO_PUBLIC_CREATE_USERS_API_URL) ??
    joinUrl(apiBaseUrl, "abonnement/users"),
  fetchUsersApiUrl:
    nonEmpty(process.env.EXPO_PUBLIC_FETCH_USERS_API_URL) ??
    joinUrl(apiBaseUrl, "abonnement/users"),
  verifApiUrl:
    nonEmpty(process.env.EXPO_PUBLIC_VERIF_API_URL) ??
    joinUrl(apiBaseUrl, "abonnement/verif"),
  sendOtpUrl:
    nonEmpty(process.env.EXPO_PUBLIC_SEND_OTP_URL) ??
    joinUrl(apiBaseUrl, "send-whatsapp"),
} as const;

export type Env = typeof ENV;
