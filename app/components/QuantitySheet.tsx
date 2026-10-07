/**
 * Feuille de commande : quantité (stepper), urgence, notes, confirmation.
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Medicament } from "../lib/api";
import { AppButton, AppSheet, AppTextField } from "./ui";
import { colors, fontSize, spacing } from "./ui/theme";

type QuantitySheetProps = {
  item: Medicament | null;
  ordering: boolean;
  onClose: () => void;
  onConfirm: (order: {
    quantite: number;
    urgence: string;
    notes?: string;
  }) => void;
};

export const QuantitySheet = ({
  item,
  ordering,
  onClose,
  onConfirm,
}: QuantitySheetProps) => {
  // État initial frais à chaque médicament : le parent remonte la
  // feuille avec `key={item.id}` (pas de setState dans un effet).
  const [quantite, setQuantite] = useState(1);
  const [urgent, setUrgent] = useState(false);
  const [notes, setNotes] = useState("");

  const adjust = (delta: number): void => {
    void Haptics.selectionAsync().catch(() => undefined);
    setQuantite((previous) => Math.min(999, Math.max(1, previous + delta)));
  };

  return (
    <AppSheet
      visible={item !== null}
      onClose={onClose}
      title={item ? `Commander « ${item.nomMedicament} »` : "Commander"}
    >
      {item ? (
        <>
          <Text style={styles.supplier}>
            auprès de{" "}
            {item.pharmacie?.nomPharmacie ??
              item.pharmacie?.nom_pharmacie ??
              "cette pharmacie"}
            {item.prix != null ? ` — ${item.prix} F / unité` : ""}
          </Text>
          <Text style={styles.label}>Quantité</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => adjust(-1)}
              disabled={quantite <= 1}
              accessibilityRole="button"
              accessibilityLabel="Diminuer la quantité"
            >
              <MaterialIcons name="remove" size={24} color={colors.surface} />
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantite}</Text>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => adjust(1)}
              accessibilityRole="button"
              accessibilityLabel="Augmenter la quantité"
            >
              <MaterialIcons name="add" size={24} color={colors.surface} />
            </TouchableOpacity>
          </View>
          {item.prix != null ? (
            <Text style={styles.total}>
              Total estimé : {item.prix * quantite} F
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.urgentRow}
            onPress={() => setUrgent((previous) => !previous)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: urgent }}
            accessibilityLabel="Commande urgente"
          >
            <MaterialIcons
              name={urgent ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={urgent ? colors.danger : colors.textMuted}
            />
            <Text style={styles.urgentText}>Commande urgente</Text>
          </TouchableOpacity>
          <AppTextField
            label="Notes (optionnel)"
            placeholder="Précisions pour le fournisseur…"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
          <AppButton
            title="Confirmer la commande"
            onPress={() =>
              onConfirm({
                quantite,
                urgence: urgent ? "urgente" : "normale",
                notes: notes.trim() || undefined,
              })
            }
            loading={ordering}
            fullWidth
            accessibilityLabel="Confirmer la commande"
          />
        </>
      ) : null}
    </AppSheet>
  );
};

const styles = StyleSheet.create({
  supplier: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  stepper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    fontSize: fontSize.display,
    fontWeight: "700",
    color: colors.text,
    marginHorizontal: spacing.xxl,
    minWidth: 60,
    textAlign: "center",
  },
  total: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.accentText,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  urgentText: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginLeft: spacing.sm,
  },
});
