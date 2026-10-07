/**
 * Validation et normalisation des saisies utilisateur.
 * Fonctions pures, sans dépendance React Native : testables en Node.
 */

/** Normalise un numéro de téléphone (espaces, points et tirets retirés). */
export const normalizePhone = (phone: string): string =>
  phone.replace(/[\s.\-()]/g, "");

/**
 * Numéro plausible : 8 à 15 chiffres, éventuel `+` initial.
 * Renvoie le numéro normalisé, ou null si invalide.
 */
export const parsePhone = (phone: string): string | null => {
  const normalized = normalizePhone(phone.trim());
  return /^\+?\d{8,15}$/.test(normalized) ? normalized : null;
};

/** Validation minimale d'un e-mail optionnel (chaîne vide acceptée). */
export const isValidOptionalEmail = (email: string): boolean => {
  const trimmed = email.trim();
  if (trimmed === "") {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/** Code OTP : exactement 6 chiffres. */
export const isValidOtpFormat = (code: string): boolean =>
  /^\d{6}$/.test(code);

/** Nom/prénom : au moins 2 caractères non blancs. */
export const isValidPersonName = (name: string): boolean =>
  name.trim().length >= 2;
