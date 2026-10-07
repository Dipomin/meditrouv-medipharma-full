/**
 * Toasts non bloquants (succès / erreur / info).
 * `ToastProvider` se monte une fois dans `_layout.tsx`, `useToast()`
 * expose `show/success/error/info` depuis n'importe quel écran.
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import * as Haptics from "expo-haptics";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  initialToastState,
  nextToastId,
  toastReducer,
  type ToastItem,
  type ToastKind,
} from "../../lib/toast";
import { colors, fontSize, globalMenuReserve, radius, spacing } from "./theme";

const DEFAULT_DURATION_MS = 3500;

export type ToastAction = {
  label: string;
  onPress: () => void;
};

type ToastContextValue = {
  show: (
    message: string,
    kind?: ToastKind,
    durationMs?: number,
    action?: ToastAction
  ) => void;
  success: (message: string, durationMs?: number, action?: ToastAction) => void;
  error: (message: string, durationMs?: number, action?: ToastAction) => void;
  info: (message: string, durationMs?: number, action?: ToastAction) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé sous <ToastProvider>.");
  }
  return context;
};

const KIND_STYLE: Record<ToastKind, { background: string; icon: string }> = {
  success: { background: colors.primary, icon: "✓" },
  error: { background: colors.danger, icon: "!" },
  info: { background: colors.info, icon: "i" },
};

const ToastRow = ({
  item,
  onDismiss,
  onAction,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}) => {
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [fade]);

  const kind = KIND_STYLE[item.kind];
  return (
    <Animated.View style={[styles.row, { opacity: fade }]}>
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: kind.background }]}
        onPress={() => onDismiss(item.id)}
        activeOpacity={0.9}
        accessibilityRole="alert"
        accessibilityLabel={item.message}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{kind.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {item.message}
        </Text>
        {item.actionLabel ? (
          <TouchableOpacity
            style={styles.action}
            onPress={() => onAction(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.actionLabel}
          >
            <Text style={styles.actionText}>{item.actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(toastReducer, initialToastState);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const actions = useRef(new Map<string, () => void>());
  const insets = useSafeAreaInsets();

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) {
        clearTimeout(timer);
      }
      timers.current.clear();
      actions.current.clear();
    },
    []
  );

  const forget = useCallback((id: string): void => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    actions.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: string): void => {
      forget(id);
      dispatch({ type: "dismiss", id });
    },
    [forget]
  );

  const handleAction = useCallback(
    (id: string): void => {
      const onPress = actions.current.get(id);
      forget(id);
      dispatch({ type: "dismiss", id });
      onPress?.();
    },
    [forget]
  );

  const show = useCallback(
    (
      message: string,
      kind: ToastKind = "info",
      durationMs = DEFAULT_DURATION_MS,
      action?: ToastAction
    ): void => {
      const id = nextToastId();
      if (kind === "success") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => undefined);
      } else if (kind === "error") {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => undefined);
      }
      dispatch({
        type: "show",
        toast: { id, kind, message, actionLabel: action?.label },
      });
      if (action) {
        actions.current.set(id, action.onPress);
      }
      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          actions.current.delete(id);
          dispatch({ type: "dismiss", id });
        }, durationMs)
      );
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, durationMs, action) =>
        show(message, "success", durationMs, action),
      error: (message, durationMs, action) =>
        show(message, "error", durationMs, action),
      info: (message, durationMs, action) =>
        show(message, "info", durationMs, action),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        style={[styles.viewport, { bottom: insets.bottom + globalMenuReserve }]}
        pointerEvents="box-none"
      >
        {state.items.map((item) => (
          <ToastRow
            key={item.id}
            item={item}
            onDismiss={dismiss}
            onAction={handleAction}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  row: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 2,
  },
  badgeText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  message: {
    flex: 1,
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  action: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  actionText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
});
