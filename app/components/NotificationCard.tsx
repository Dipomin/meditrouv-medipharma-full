import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { NotificationPharmacien } from "../lib/types";
import { colors, fontSize } from "./ui/theme";

const STATUT_STYLE: Record<string, { label: string; color: string }> = {
  non_lue: { label: "Nouvelle", color: colors.danger },
  lue: { label: "Lue", color: colors.textMuted },
  traitee: { label: "Traitée", color: colors.primary },
};

export const formatRelativeDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString("fr-FR");
};

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationPharmacien;
  onPress: (item: NotificationPharmacien) => void;
}) {
  const statut = STATUT_STYLE[item.statut] ?? STATUT_STYLE.non_lue;
  const unread = item.statut === "non_lue";
  return (
    <TouchableOpacity
      style={[styles.card, unread && styles.cardUnread]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Notification : ${item.medicamentNom}`}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {unread && <View style={styles.dot} />}
          <Text style={styles.medicament} numberOfLines={1}>
            {item.medicamentNom}
          </Text>
        </View>
        <Text style={[styles.statut, { color: statut.color }]}>
          {statut.label}
        </Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {item.message}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatRelativeDate(item.createdAt)}</Text>
        {item.whatsappSent && (
          <View style={styles.whatsapp}>
            <MaterialIcons name="check-circle" size={14} color={colors.primary} />
            <Text style={styles.whatsappText}>WhatsApp envoyé</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default memo(NotificationCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    marginRight: 6,
  },
  medicament: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  statut: {
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  date: {
    fontSize: fontSize.caption,
    color: colors.textFaint,
  },
  whatsapp: {
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappText: {
    fontSize: fontSize.caption,
    color: colors.primary,
    marginLeft: 4,
  },
});
