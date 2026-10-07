/* eslint-disable no-console -- point centralisé unique autorisé à écrire dans la console. */
/**
 * Journalisation centralisée.
 *
 * - `debug` / `info` : uniquement en développement (__DEV__), jamais en production.
 * - `warn` / `error` : conservés partout (erreurs d'exécution utiles au diagnostic).
 *
 * Ne JAMAIS journaliser de secret (OTP, mot de passe, token, identifiant de
 * paiement) : passer uniquement des messages statiques et des erreurs.
 */

type LogArgs = [message: string, ...details: unknown[]];

const format = (level: string, message: string): string =>
  `[medipharma:${level}] ${message}`;

export const logger = {
  debug: (...args: LogArgs): void => {
    if (__DEV__) {
      console.log(format("debug", args[0]), ...args.slice(1));
    }
  },
  info: (...args: LogArgs): void => {
    if (__DEV__) {
      console.info(format("info", args[0]), ...args.slice(1));
    }
  },
  warn: (...args: LogArgs): void => {
    console.warn(format("warn", args[0]), ...args.slice(1));
  },
  error: (...args: LogArgs): void => {
    console.error(format("error", args[0]), ...args.slice(1));
  },
};

export default logger;
