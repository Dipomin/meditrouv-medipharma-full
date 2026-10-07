/**
 * Champ de saisie standard (label, erreur inline, icônes, focus visible).
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, fontSize, radius, spacing } from "./theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type AppTextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  /** Ref transmise au TextInput natif (chaînage `returnKeyType="next"`). */
  inputRef?: React.Ref<TextInput>;
};

export const AppTextField = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputRef,
  style,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...inputProps
}: AppTextFieldProps) => {
  const [focused, setFocused] = useState(false);
  const showError = error !== null && error !== undefined && error !== "";

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          showError && styles.inputRowError,
        ]}
      >
        {leftIcon ? (
          <MaterialIcons
            name={leftIcon}
            size={20}
            color={colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          ref={inputRef}
          style={[styles.input, style]}
          placeholderTextColor={colors.textFaint}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          accessibilityLabel={accessibilityLabel ?? label}
          {...inputProps}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={8}
            accessibilityRole={onRightIconPress ? "button" : undefined}
          >
            <MaterialIcons name={rightIcon} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {showError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    // S'étire dans les parents centrés (ex. carte de connexion).
    alignSelf: "stretch",
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 1,
    backgroundColor: colors.surface,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
