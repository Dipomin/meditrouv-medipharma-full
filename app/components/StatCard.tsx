import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fontSize } from "./ui/theme";

function StatCard({
  icon,
  value,
  label,
  color,
  onPress,
}: {
  icon: "notifications" | "inventory" | "warning" | "shopping-cart";
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.card}>
      <MaterialIcons name={icon} size={28} color={color} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
  if (!onPress) {
    return body;
  }
  return (
    <TouchableOpacity
      style={styles.touchable}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} : ${value}`}
    >
      {body}
    </TouchableOpacity>
  );
}

export default memo(StatCard);

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  value: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  label: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
});
