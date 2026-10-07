/**
 * Carte de requête broadcast : résumé des lignes, statut, urgence,
 * compteur de propositions (x/5).
 */

import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  compteurPropositions,
  demandeStatutMeta,
  isUrgentDemande,
  resumeLignes,
} from "../lib/demandes";
import type { DemandeInter } from "../lib/types";
import { colors, fontSize, spacing } from "./ui/theme";

type DemandeCardProps = {
  item: DemandeInter;
  tab: "recues" | "emises";
  onPress: (item: DemandeInter) => void;
};

export const DemandeCard = memo(({ item, tab, onPress }: DemandeCardProps) => {
  const meta = demandeStatutMeta(item.statut);
  const urgent = isUrgentDemande(item.urgence);

  return (
    <TouchableOpacity
      style={[styles.card, urgent && styles.cardUrgent]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Requête : ${resumeLignes(item.lignes)}`}
    >
      <View style={styles.header}>
        <Text style={styles.resume} numberOfLines={2}>
          {resumeLignes(item.lignes)}
        </Text>
        <Text style={[styles.statut, { color: meta.color }]}>{meta.label}</Text>
      </View>

      {urgent && (
        <View style={styles.urgentBanner}>
          <MaterialIcons name="warning" size={16} color={colors.surface} />
          <Text style={styles.urgentText}>REQUÊTE URGENTE</Text>
        </View>
      )}

      {tab === "recues" && item.nomPharmacieDemandeuse && (
        <View style={styles.pharmacieRow}>
          <MaterialIcons
            name="local-pharmacy"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.pharmacie} numberOfLines={1}>
            {item.nomPharmacieDemandeuse}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.compteur}>
          {compteurPropositions(item.propositionsCount)} propositions
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString("fr-FR")}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

DemandeCard.displayName = "DemandeCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.lg - 2,
    marginBottom: spacing.sm + 2,
  },
  cardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  resume: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  statut: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.sm,
    alignSelf: "flex-start",
  },
  urgentText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: fontSize.caption,
    marginLeft: spacing.xs + 2,
  },
  pharmacieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pharmacie: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: "600",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  compteur: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  date: {
    fontSize: fontSize.caption,
    color: colors.textFaint,
  },
});
