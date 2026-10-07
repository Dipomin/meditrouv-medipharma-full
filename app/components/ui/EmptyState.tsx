/**
 * État vide standard (icône + titre + message + action optionnelle).
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "./AppButton";
import { colors, fontSize, spacing } from "./theme";

type EmptyStateProps = {
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "dark" | "light";
};

export const EmptyState = ({
  icon = "inbox",
  title,
  message,
  actionLabel,
  onAction,
  tone = "light",
}: EmptyStateProps) => {
  const onDark = tone === "dark";
  return (
    <View style={styles.container}>
      <MaterialIcons
        name={icon}
        size={52}
        color={onDark ? colors.textOnDark : colors.textFaint}
      />
      <Text style={[styles.title, onDark ? styles.onDark : styles.onLight]}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, onDark ? styles.onDark : styles.onLight]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant={onDark ? "secondary" : "primary"}
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.md,
  },
  message: {
    fontSize: fontSize.md,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 21,
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
