/**
 * État des toasts (logique pure, sans React) : testable en Node.
 * Le rendu vit dans `app/components/ui/Toast.tsx`.
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  /** Libellé du bouton d'action (ex. « Annuler »), absent si aucune. */
  actionLabel?: string;
};

export type ToastState = {
  items: ToastItem[];
};

/** Nombre maximal de toasts affichés simultanément. */
export const MAX_TOASTS = 3;

export type ToastAction =
  | { type: "show"; toast: ToastItem }
  | { type: "dismiss"; id: string }
  | { type: "clear" };

export const initialToastState: ToastState = { items: [] };

export const toastReducer = (
  state: ToastState,
  action: ToastAction
): ToastState => {
  switch (action.type) {
    case "show": {
      const items = [
        ...state.items.filter((item) => item.id !== action.toast.id),
        action.toast,
      ];
      return { items: items.slice(-MAX_TOASTS) };
    }
    case "dismiss":
      return { items: state.items.filter((item) => item.id !== action.id) };
    case "clear":
      return initialToastState;
  }
};

let toastSeq = 0;

/** Identifiant unique pour un nouveau toast. */
export const nextToastId = (): string => {
  toastSeq += 1;
  return `toast-${Date.now().toString(36)}-${toastSeq}`;
};
