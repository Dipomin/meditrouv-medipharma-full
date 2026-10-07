/**
 * Carte de commande inter-pharmacies : timeline, urgence, actions.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { memo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  availableActions,
  isUrgent,
  statutMeta,
  timelineSteps,
} from "../lib/commandes";
import type { Commande } from "../lib/types";
import { colors, fontSize, minTouchTarget, radius, spacing } from "./ui/theme";

type CommandeCardProps = {
  item: Commande;
  tab: "recues" | "emises";
  pending: boolean;
  onAction: (item: Commande, statut: string) => void;
};

export const CommandeCard = memo(
  ({ item, tab, pending, onAction }: CommandeCardProps) => {
    const meta = statutMeta(item.statut);
    const steps = timelineSteps(item.statut);
    const actions = availableActions(item.statut, tab);
    const urgent = isUrgent(item.urgence);

    return (
      <View style={[styles.card, urgent && styles.cardUrgent]}>
        <View style={styles.header}>
          <Text style={styles.medicament} numberOfLines={1}>
            {item.quantite} x {item.medicamentNom}
          </Text>
          <Text style={[styles.statut, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>

        {urgent && (
          <View style={styles.urgentBanner}>
            <MaterialIcons
              name="warning"
              size={16}
              color={colors.surface}
            />
            <Text style={styles.urgentText}>COMMANDE URGENTE</Text>
          </View>
        )}

        {steps.length > 0 ? (
          <View style={styles.timeline} accessibilityLabel={`Statut : ${meta.label}`}>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.step}>
                <View
                  style={[styles.dot, step.done && styles.dotDone]}
                />
                <Text
                  style={[styles.stepLabel, step.done && styles.stepLabelDone]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      step.done && steps[index + 1].done && styles.connectorDone,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        ) : null}

        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        {item.telephoneContact ? (
          <Text style={styles.contact}>Contact : {item.telephoneContact}</Text>
        ) : null}
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString("fr-FR")}
        </Text>

        {actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.statut}
                style={[
                  styles.actionButton,
                  action.primary
                    ? styles.actionPrimary
                    : styles.actionSecondary,
                ]}
                onPress={() => onAction(item, action.statut)}
                disabled={pending}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                {pending ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      action.primary ? colors.surface : colors.danger
                    }
                  />
                ) : (
                  <Text
                    style={[
                      styles.actionText,
                      action.primary
                        ? styles.actionTextPrimary
                        : styles.actionTextSecondary,
                    ]}
                  >
                    {action.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }
);

CommandeCard.displayName = "CommandeCard";

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
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  medicament: {
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
  timeline: {
    flexDirection: "row",
    marginVertical: spacing.sm,
  },
  step: {
    flex: 1,
    alignItems: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textFaint,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  stepLabelDone: {
    color: colors.primary,
    fontWeight: "700",
  },
  connector: {
    position: "absolute",
    top: 6,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: colors.border,
  },
  connectorDone: {
    backgroundColor: colors.primary,
  },
  notes: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  contact: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  date: {
    fontSize: fontSize.caption,
    color: colors.textFaint,
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    marginTop: spacing.sm + 2,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    minHeight: minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionSecondary: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  actionText: {
    fontWeight: "700",
  },
  actionTextPrimary: {
    color: colors.surface,
  },
  actionTextSecondary: {
    color: colors.danger,
  },
});
