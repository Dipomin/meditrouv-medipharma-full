/**
 * Temporisation du splash screen personnalisé.
 *
 * La fermeture du splash est pilotée par une minuterie
 * (`splashDismissDelay`) et JAMAIS par le rappel de fin d'animation
 * (`Animated.start(callback)`) : sur certains appareils le rappel natif
 * n'est pas invoqué et l'application restait bloquée sur le logo.
 * L'animation reste purement décorative.
 */

/** Durée d'un fondu (apparition puis disparition) en millisecondes. */
export const SPLASH_FADE_MS = 1000;

/** Durée d'affichage nominale du splash en millisecondes. */
export const DEFAULT_SPLASH_DURATION_MS = 3000;

/** Marge ajoutée avant fermeture pour laisser la transition se terminer. */
export const SPLASH_DISMISS_BUFFER_MS = 500;

/**
 * Pause entre les deux fondus, bornée (jamais négative si la durée
 * demandée est inférieure aux deux fondus).
 */
export const splashPauseDuration = (durationMs: number): number =>
  Math.max(0, durationMs - 2 * SPLASH_FADE_MS);

/**
 * Délai garanti avant fermeture du splash, toujours strictement positif.
 */
export const splashDismissDelay = (durationMs: number): number =>
  Math.max(
    SPLASH_DISMISS_BUFFER_MS,
    durationMs + SPLASH_DISMISS_BUFFER_MS
  );
