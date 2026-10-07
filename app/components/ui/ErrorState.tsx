/**
 * État d'erreur standard (message + bouton réessayer).
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "./AppButton";
import { colors, fontSize, spacing } from "./theme";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  tone?: "dark" | "light";
};

export const ErrorState = ({
  message,
  onRetry,
  retryLabel = "Réessayer",
  tone = "light",
}: ErrorStateProps) => {
  const onDark = tone === "dark";
  return (
    <View style={styles.container}>
      <MaterialIcons
        name="error-outline"
        size={52}
        color={onDark ? colors.textOnDark : colors.danger}
      />
      <Text
        style={[styles.message, onDark ? styles.onDark : styles.onLight]}
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
      {onRetry ? (
        <AppButton
          title={retryLabel}
          onPress={onRetry}
          variant={onDark ? "secondary" : "primary"}
          icon="refresh"
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  message: {
    fontSize: fontSize.lg,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 23,
  },
  onDark: {
    color: colors.textOnDark,
  },
  onLight: {
    color: colors.text,
  },
  action: {
    marginTop: spacing.lg,
  },
});
