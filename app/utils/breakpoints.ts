/**
 * Logique de breakpoints pure (sans React Native) : testable en Node.
 * Consommée par `app/utils/responsive.ts` pour les lectures d'écran.
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
} as const;

export type DeviceType = "mobile" | "tablet" | "desktop";

/** Type d'appareil déduit d'une largeur en points. */
export const getDeviceTypeForWidth = (width: number): DeviceType => {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
};

/** Vrai pour tablette et desktop. */
export const isTabletWidth = (width: number): boolean =>
  width >= BREAKPOINTS.tablet;

/**
 * Nombre de colonnes tenant dans `width` pour des tuiles d'au moins
 * `minItemWidth` séparées de `spacing`. Toujours >= 1.
 */
export const columnsForWidth = (
  width: number,
  minItemWidth: number,
  spacing = 10
): number => Math.max(1, Math.floor(width / (minItemWidth + spacing)));

/**
 * Largeur de contenu : pleine largeur sur mobile, centrée et plafonnée
 * sur tablette/desktop.
 */
export const contentWidthFor = (width: number, maxWidth = 600): number =>
  isTabletWidth(width) ? Math.min(width * 0.8, maxWidth) : width;
