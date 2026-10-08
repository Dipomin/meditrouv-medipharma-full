/**
 * Design tokens partagés (Meditrouv / Medipharma).
 * Module pur, sans dépendance React Native : testable en Node.
 *
 * Note de synchronisation : ce fichier est dupliqué à l'identique dans
 * les deux applications. Toute modification doit être reportée dans
 * l'autre app (`meditrouv/app/components/ui/theme.ts` <->
 * `medipharma/app/components/ui/theme.ts`).
 */

export const colors = {
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primarySoft: "rgba(46, 125, 50, 0.1)",
  accent: "#ff6a00",
  accentDark: "#E65100",
  /** Orange assombri pour texte sur blanc et fond de bouton (contraste AA). */
  accentText: "#C2410C",
  danger: "#D32F2F",
  dangerSoft: "rgba(211, 47, 47, 0.1)",
  warning: "#EF6C00",
  info: "#1565C0",
  background: "#b1d6c8",
  surface: "#ffffff",
  surfaceMuted: "#f5f5f5",
  skeleton: "#e0e0e0",
  skeletonOnDark: "rgba(255, 255, 255, 0.55)",
  text: "#333333",
  textSecondary: "#555555",
  textMuted: "#666666",
  textFaint: "#767676",
  textOnDark: "#ffffff",
  border: "#dddddd",
  borderSoft: "#eeeeee",
  overlay: "rgba(0, 0, 0, 0.4)",
  scrim: "rgba(0, 0, 0, 0.5)",
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 5,
  md: 8,
  lg: 10,
  xl: 15,
  xxl: 20,
  full: 999,
} as const;

export const fontSize = {
  xs: 11,
  caption: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "600",
  bold: "700",
} as const;

/** Cible tactile minimale recommandée (points). */
export const minTouchTarget = 44;

/** Espace vertical réservé au GlobalMenu fixé en bas d'écran. */
export const globalMenuReserve = 100;

/**
 * Hauteur tenant compte de la barre système Android/iOS : le menu fixé
 * en bas d'écran et la réserve de contenu doivent grandir de l'inset
 * bas, sinon les boutons système recouvrent le menu (edge-to-edge).
 */
export const withBottomInset = (base: number, insetBottom: number): number =>
  base + Math.max(0, insetBottom);

/**
 * Convertit un hexadécimal `#rrggbb` en chaîne `rgba(...)`.
 * Lève une erreur si le format est invalide.
 */
export const withOpacity = (hex: string, alpha: number): string => {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    throw new Error(`Couleur hex invalide : ${hex}`);
  }
  const value = parseInt(match[1], 16);
  const clamped = Math.min(1, Math.max(0, alpha));
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${clamped})`;
};

const channelLuminance = (hex: string, at: number): number => {
  const channel = parseInt(hex.slice(at, at + 2), 16) / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (hex: string): number =>
  0.2126 * channelLuminance(hex, 1) +
  0.7152 * channelLuminance(hex, 3) +
  0.0722 * channelLuminance(hex, 5);

/**
 * Ratio de contraste WCAG entre deux hexadécimaux `#rrggbb` (1 à 21).
 * Sert de garde-fou : les paires texte du thème doivent atteindre 4.5.
 */
export const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  return (lighter + 0.05) / (darker + 0.05);
};

export const shadows = {
  card: {
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: { elevation: 3 },
  },
  raised: {
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    android: { elevation: 8 },
  },
} as const;
