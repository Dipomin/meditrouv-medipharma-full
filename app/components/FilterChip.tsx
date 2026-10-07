/**
 * Puce de filtre/chip générique (rayon, garde, communes, historique).
 * Ton `light` (défaut) pour les fonds menthe, `dark` pour fonds sombres.
 */

import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { colors, fontSize, spacing } from "./ui/theme";

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  tone?: "dark" | "light";
};

export const FilterChip = ({
  label,
  selected = false,
  onPress,
  accessibilityLabel,
  tone = "light",
}: FilterChipProps) => {
  const onDark = tone === "dark";
  const handlePress = (): void => {
    void Haptics.selectionAsync().catch(() => undefined);
    onPress();
  };
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        onDark ? styles.chipOnDark : styles.chipOnLight,
        selected && (onDark ? styles.chipOnDarkActive : styles.chipOnLightActive),
      ]}
      onPress={handlePress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          styles.text,
          onDark ? styles.textOnDark : styles.textOnLight,
          selected && onDark && styles.textActiveOnDark,
          selected && !onDark && styles.textActiveOnLight,
        ]}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: spacing.lg,
    paddingVertical: 8,
    paddingHorizontal: spacing.md + 2,
    marginRight: spacing.sm,
    minHeight: 36,
    justifyContent: "center",
  },
  chipOnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  chipOnDarkActive: {
    backgroundColor: colors.surface,
  },
  chipOnLight: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOnLightActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  textOnDark: {
    color: colors.surface,
  },
  textOnLight: {
    color: colors.textMuted,
  },
  textActiveOnDark: {
    color: colors.primary,
  },
  textActiveOnLight: {
    color: colors.surface,
  },
});
