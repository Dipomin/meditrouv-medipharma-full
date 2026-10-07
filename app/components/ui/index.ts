/**
 * Kit UI partagé — point d'entrée.
 *
 * Note de synchronisation : dossier dupliqué à l'identique dans
 * Meditrouv et Medipharma (`app/components/ui/`).
 */

export { AppButton, type AppButtonVariant } from "./AppButton";
export { AppHeader } from "./AppHeader";
export { AppSheet } from "./AppSheet";
export { AppTextField } from "./AppTextField";
export { EmptyState } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export { ListSkeleton, Skeleton } from "./Skeleton";
export { OfflineBanner } from "./OfflineBanner";
export { Screen, type BackgroundSource } from "./Screen";
export { ToastProvider, useToast, type ToastAction } from "./Toast";
export {
  colors,
  fontSize,
  fontWeight,
  globalMenuReserve,
  minTouchTarget,
  radius,
  shadows,
  spacing,
  withOpacity,
  type ColorToken,
} from "./theme";
