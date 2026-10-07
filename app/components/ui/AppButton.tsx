/**
 * Bouton standard (variantes, état de chargement, haptique légère).
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, minTouchTarget, radius, spacing } from "./theme";

export type AppButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export const AppButton = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: AppButtonProps) => {
  const blocked = disabled || loading;

  const handlePress = (): void => {
    if (blocked) {
      return;
    }
    if (haptic) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        fullWidth && styles.fullWidth,
        blocked && styles.blocked,
        style,
      ]}
      onPress={handlePress}
      disabled={blocked}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: blocked, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "secondary" ? colors.primary : colors.surface}
        />
      ) : (
        <>
          {icon ? (
            <MaterialIcons
              name={icon}
              size={20}
              color={variant === "secondary" ? colors.primary : colors.surface}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[styles.text, styles[`${variant}Text`], textStyle]}
            maxFontSizeMultiplier={1.5}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    minHeight: minTouchTarget,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  blocked: {
    opacity: 0.55,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  accent: {
    backgroundColor: colors.accentText,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: fontSize.lg,
    textAlign: "center",
  },
  primaryText: {
    color: colors.surface,
  },
  accentText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.surface,
  },
  icon: {
    marginRight: spacing.sm,
  },
});
