/**
 * Ligne d'alerte swipable :
 * - glisser vers la gauche → « Lue » / « Traitée » ;
 * - glisser vers la droite → « Stock » (réassort ciblé).
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import type { NotificationPharmacien } from "../lib/types";
import NotificationCard from "./NotificationCard";
import { colors, fontSize, spacing } from "./ui/theme";

type SwipeableAlertRowProps = {
  item: NotificationPharmacien;
  onPress: (item: NotificationPharmacien) => void;
  onMarkRead: (item: NotificationPharmacien) => void;
  onMarkDone: (item: NotificationPharmacien) => void;
  onStock: (item: NotificationPharmacien) => void;
};

const SwipeAction = ({
  label,
  icon,
  background,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  background: string;
  onPress: () => void;
  accessibilityLabel: string;
}) => (
  <TouchableOpacity
    style={[styles.action, { backgroundColor: background }]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <MaterialIcons name={icon} size={22} color={colors.surface} />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

export const SwipeableAlertRow = ({
  item,
  onPress,
  onMarkRead,
  onMarkDone,
  onStock,
}: SwipeableAlertRowProps) => {
  const swipeable = useRef<Swipeable>(null);

  const close = (): void => {
    swipeable.current?.close();
  };

  const act = (fn: (target: NotificationPharmacien) => void): void => {
    void Haptics.selectionAsync().catch(() => undefined);
    close();
    fn(item);
  };

  const alreadyRead = item.statut !== "non_lue";
  const alreadyDone = item.statut === "traitee";

  return (
    <Swipeable
      ref={swipeable}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={() => {
        void Haptics.selectionAsync().catch(() => undefined);
      }}
      renderLeftActions={() => (
        <View style={styles.leftActions}>
          <SwipeAction
            label="Stock"
            icon="inventory"
            background={colors.primary}
            onPress={() => act(onStock)}
            accessibilityLabel={`Réassortir ${item.medicamentNom}`}
          />
        </View>
      )}
      renderRightActions={() => (
        <View style={styles.rightActions}>
          {!alreadyRead && (
            <SwipeAction
              label="Lue"
              icon="drafts"
              background={colors.info}
              onPress={() => act(onMarkRead)}
              accessibilityLabel="Marquer comme lue"
            />
          )}
          {!alreadyDone && (
            <SwipeAction
              label="Traitée"
              icon="check-circle"
              background={colors.primary}
              onPress={() => act(onMarkDone)}
              accessibilityLabel="Marquer comme traitée"
            />
          )}
        </View>
      )}
    >
      <NotificationCard item={item} onPress={onPress} />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  leftActions: {
    flexDirection: "row",
    marginBottom: spacing.sm + 2,
    marginRight: spacing.sm,
  },
  rightActions: {
    flexDirection: "row",
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.sm,
  },
  action: {
    width: 84,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  actionText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
