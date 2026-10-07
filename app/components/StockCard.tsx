import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Medicament } from "../lib/types";
import { colors, fontSize } from "./ui/theme";

export const stockLevel = (
  quantite: number
): { label: string; color: string } => {
  if (quantite <= 0) return { label: "Rupture", color: colors.danger };
  if (quantite <= 5)
    return { label: "Stock faible", color: colors.accentText };
  return { label: "En stock", color: colors.primary };
};

type StockCardProps = {
  item: Medicament;
  onPress: (item: Medicament) => void;
  onQuickAdd: (item: Medicament) => void;
  /** Ajustement immédiat (+/−) ; absent = pas de stepper. */
  onAdjust?: (item: Medicament, delta: number) => void;
  /** Ligne dense pour le mode inventaire. */
  compact?: boolean;
  /** Enregistrement d'un ajustement en cours. */
  adjusting?: boolean;
};

function StockCard({
  item,
  onPress,
  onQuickAdd,
  onAdjust,
  compact = false,
  adjusting = false,
}: StockCardProps) {
  const level = stockLevel(item.quantite);
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Stock : ${item.nomMedicament}`}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {item.nomMedicament}
        </Text>
        <Text style={[styles.level, { color: level.color }]}>
          {level.label}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.quantity}>Qté : {item.quantite}</Text>
        {item.prix != null && <Text style={styles.price}>{item.prix} F</Text>}
      </View>
      {onAdjust ? (
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepper}
            onPress={() => onAdjust(item, -1)}
            disabled={adjusting || item.quantite <= 0}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Retirer une unité de ${item.nomMedicament}`}
          >
            <MaterialIcons name="remove" size={20} color={colors.surface} />
          </TouchableOpacity>
          {adjusting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.stepperHint}>Ajuster</Text>
          )}
          <TouchableOpacity
            style={styles.stepper}
            onPress={() => onAdjust(item, 1)}
            disabled={adjusting}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter une unité de ${item.nomMedicament}`}
          >
            <MaterialIcons name="add" size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onQuickAdd(item)}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter du stock pour ${item.nomMedicament}`}
          >
            <MaterialIcons name="add-circle" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Réassort +10</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onPress(item)}
            accessibilityRole="button"
            accessibilityLabel="Modifier"
          >
            <Text style={styles.editText}>Modifier</Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(StockCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardCompact: {
    paddingVertical: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  level: {
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quantity: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.accentText,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 8,
  },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  editText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 8,
    marginTop: 2,
  },
  stepper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
