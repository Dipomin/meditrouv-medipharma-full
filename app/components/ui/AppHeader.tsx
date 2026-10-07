/**
 * En-tête d'écran standard (retour + titre + action optionnelle).
 * Ton `light` (défaut) : texte sombre, pour écrans sur fond menthe.
 * Ton `dark` : texte blanc, pour écrans sur fond image sombre.
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, minTouchTarget, spacing } from "./theme";

type AppHeaderProps = {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  right?: ReactNode;
  tone?: "dark" | "light";
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export const AppHeader = ({
  title,
  onBack,
  hideBack = false,
  right,
  tone = "light",
  style,
  accessibilityLabel,
}: AppHeaderProps) => {
  const router = useRouter();
  const onDark = tone === "dark";
  const canGoBack = router.canGoBack();
  const handleBack = onBack ?? (canGoBack ? () => router.back() : undefined);
  const showBack = !hideBack && handleBack !== undefined;

  return (
    <View style={[styles.header, style]}>
      {showBack ? (
        <TouchableOpacity
          style={[styles.backButton, onDark && styles.backButtonOnDark]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? "Retour"}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={onDark ? colors.textOnDark : colors.primary}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text
        style={[styles.title, onDark ? styles.titleOnDark : styles.titleOnLight]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: minTouchTarget + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: minTouchTarget / 2,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonOnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  backPlaceholder: {
    width: minTouchTarget,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  titleOnDark: {
    color: colors.textOnDark,
  },
  titleOnLight: {
    color: colors.text,
  },
  right: {
    minWidth: minTouchTarget,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
