/**
 * Utilitaires pour la gestion responsive de l'application
 * Adaptation automatique aux différentes tailles d'écran (mobile, tablette)
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { useMemo } from "react";
import { Dimensions, PixelRatio, useWindowDimensions } from "react-native";

import {
  BREAKPOINTS,
  columnsForWidth,
  contentWidthFor,
  getDeviceTypeForWidth,
  type DeviceType,
} from "./breakpoints";

export { BREAKPOINTS, type DeviceType };

// Dimensions de démarrage (portrait verrouillé côté natif : stables en
// pratique). Les helpers ci-dessous relisent la fenêtre à chaque appel
// pour rester justes sur tablette/web en cas de rotation.
const { width: initialWidth, height: initialHeight } = Dimensions.get("window");
export const screenWidth = initialWidth;
export const screenHeight = initialHeight;

/** Largeur/hauteur courantes de la fenêtre (lecture à la demande). */
export const getScreenWidth = (): number => Dimensions.get("window").width;
export const getScreenHeight = (): number => Dimensions.get("window").height;

/**
 * Dimensions réactives (re-rendu en cas de rotation/redimensionnement).
 * À préférer aux constantes `screenWidth`/`screenHeight` dans les composants.
 */
export const useScreenDimensions = (): { width: number; height: number } => {
  const { width, height } = useWindowDimensions();
  return { width, height };
};

export type Responsive = {
  width: number;
  height: number;
  deviceType: DeviceType;
  isTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  /** Valeur réactive selon le type d'appareil. */
  value: <T>(mobileValue: T, tabletValue?: T) => T;
  /** Taille de police réactive (base mobile, × scaleFactor sur tablette). */
  fontSize: (base: number, scaleFactor?: number) => number;
  /** Espacement réactif (base mobile, × scaleFactor sur tablette). */
  spacing: (base: number, scaleFactor?: number) => number;
};

/**
 * Valeurs responsives réactives (re-rendu en cas de rotation).
 * À préférer à `StyleSheet.create` statique nourri des helpers
 * non réactifs ci-dessous pour tout écran tournant sur tablette.
 */
export const useResponsive = (): Responsive => {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const deviceType = getDeviceTypeForWidth(width);
    const tablet = deviceType !== "mobile";
    return {
      width,
      height,
      deviceType,
      isTablet: tablet,
      isLandscape: width > height,
      isPortrait: height >= width,
      value: <T,>(mobileValue: T, tabletValue?: T): T =>
        tablet && tabletValue !== undefined ? tabletValue : mobileValue,
      fontSize: (base: number, scaleFactor = 1.2): number =>
        Math.round(base * (tablet ? scaleFactor : 1)),
      spacing: (base: number, scaleFactor = 1.3): number =>
        Math.round(base * (tablet ? scaleFactor : 1)),
    };
  }, [width, height]);
};

/**
 * Détermine le type d'appareil basé sur la largeur de l'écran
 */
export const getDeviceType = (): DeviceType =>
  getDeviceTypeForWidth(getScreenWidth());

/**
 * Vérifie si l'appareil est une tablette
 */
export const isTablet = (): boolean => {
  return getDeviceType() === "tablet" || getDeviceType() === "desktop";
};

/**
 * Vérifie si l'appareil est un mobile
 */
export const isMobile = (): boolean => {
  return getDeviceType() === "mobile";
};

/**
 * Obtient les dimensions de l'écran
 */
export const getScreenDimensions = () => {
  const width = getScreenWidth();
  const height = getScreenHeight();
  return {
    width,
    height,
    isLandscape: width > height,
    isPortrait: height > width,
  };
};

/**
 * Calcule une valeur responsive basée sur la largeur de l'écran
 * @param mobileValue Valeur pour mobile
 * @param tabletValue Valeur pour tablette (optionnel, par défaut = mobileValue * 1.2)
 */
export const responsiveValue = <T,>(
  mobileValue: T,
  tabletValue?: T
): T => {
  if (isTablet()) {
    return tabletValue !== undefined ? tabletValue : mobileValue;
  }
  return mobileValue;
};

/**
 * Calcule une taille de police responsive
 * @param baseFontSize Taille de base pour mobile
 * @param scaleFactor Facteur d'échelle pour tablette (par défaut: 1.2)
 */
export const responsiveFontSize = (
  baseFontSize: number,
  scaleFactor: number = 1.2
): number => {
  const pixelRatio = PixelRatio.get();
  const deviceType = getDeviceType();

  let fontSize = baseFontSize;

  if (deviceType === "tablet") {
    fontSize = baseFontSize * scaleFactor;
  } else if (deviceType === "desktop") {
    fontSize = baseFontSize * (scaleFactor * 1.1);
  }

  // Ajustement basé sur la densité de pixels
  return Math.round(fontSize / pixelRatio) * pixelRatio;
};

/**
 * Calcule un espacement responsive
 * @param baseSpacing Espacement de base pour mobile
 * @param scaleFactor Facteur d'échelle pour tablette (par défaut: 1.3)
 */
export const responsiveSpacing = (
  baseSpacing: number,
  scaleFactor: number = 1.3
): number => {
  return responsiveValue(baseSpacing, baseSpacing * scaleFactor);
};

/**
 * Calcule une largeur responsive en pourcentage
 * @param mobilePercent Pourcentage pour mobile
 * @param tabletPercent Pourcentage pour tablette (optionnel)
 */
export const responsiveWidth = (
  mobilePercent: number,
  tabletPercent?: number
): string => {
  const percent = responsiveValue(mobilePercent, tabletPercent);
  return `${percent}%`;
};

/**
 * Calcule une largeur maximale pour le contenu sur tablette
 * @param maxWidth Largeur maximale en pixels
 */
export const getMaxContentWidth = (maxWidth: number = 600): number =>
  contentWidthFor(getScreenWidth(), maxWidth);

/**
 * Obtient les marges latérales pour centrer le contenu sur tablette
 */
export const getContentMargins = (maxContentWidth?: number): number => {
  if (!isTablet()) return 0;

  const contentWidth = maxContentWidth || getMaxContentWidth();
  return Math.max(0, (getScreenWidth() - contentWidth) / 2);
};

/**
 * Styles responsive pour les conteneurs principaux
 */
export const getResponsiveContainerStyle = (maxWidth?: number) => {
  const margins = getContentMargins(maxWidth);

  return {
    marginHorizontal: margins,
    maxWidth: isTablet() ? getMaxContentWidth(maxWidth) : "100%",
    alignSelf: "center" as const,
  };
};

/**
 * Calcule le nombre de colonnes pour une grille responsive
 * @param minItemWidth Largeur minimale d'un élément
 * @param spacing Espacement entre les éléments
 */
export const getGridColumns = (
  minItemWidth: number,
  spacing: number = 10
): number => {
  const availableWidth = getScreenWidth() - getContentMargins() * 2;
  return columnsForWidth(availableWidth, minItemWidth, spacing);
};

/**
 * Obtient la configuration du menu pour l'appareil actuel
 */
export const getMenuConfig = () => {
  const deviceType = getDeviceType();

  return {
    isTablet: deviceType !== "mobile",
    itemSize: responsiveValue(24, 28),
    fontSize: responsiveFontSize(12),
    padding: responsiveSpacing(10),
    height: responsiveValue(60, 70),
  };
};

// Export des dimensions pour compatibilité
export const { width, height } = getScreenDimensions();
