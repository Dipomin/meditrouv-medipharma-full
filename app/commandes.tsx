import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CommandeCard } from "./components/CommandeCard";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  colors,
  fontSize,
  minTouchTarget,
  spacing,
  useToast,
} from "./components/ui";
import { commandesAPI, type Commande } from "./lib/api";
import { logger } from "./lib/logger";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { offlineAwareMessage } from "./lib/offline";

const TABS = [
  { id: "recues", label: "Reçues" },
  { id: "emises", label: "Émises" },
] as const;

export default function CommandesScreen() {
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  // Onglet initial pilotable par deep-link (`?tab=emises`).
  const [tab, setTab] = useState<"recues" | "emises">(
    tabParam === "emises" ? "emises" : "recues"
  );
  const [items, setItems] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  // Pur : ne touche pas l'état (mises à jour dans `settle`/`fail`,
  // appelés depuis les continuations de promesse).
  const fetchCommandes = useCallback((): Promise<Commande[]> => {
    if (!pharmacien?.pharmacieId) {
      return Promise.resolve([]);
    }
    return commandesAPI.list(pharmacien.id, pharmacien.pharmacieId, tab);
  }, [pharmacien, tab]);

  const settle = useCallback((data: Commande[]): void => {
    setItems(data);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fail = useCallback((err: unknown): void => {
    logger.error("Échec du chargement des commandes.", err);
    setError(
      offlineAwareMessage(err, "Impossible de charger les commandes.")
    );
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    let cancelled = false;
    fetchCommandes()
      .then((data) => {
        if (!cancelled) {
          settle(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          fail(error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isReady, fetchCommandes, settle, fail]);

  const reload = useCallback((): void => {
    fetchCommandes().then(settle).catch(fail);
  }, [fetchCommandes, settle, fail]);

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const handleRetry = useCallback((): void => {
    setLoading(true);
    reload();
  }, [reload]);

  const handleStatut = useCallback(
    async (commande: Commande, statut: string): Promise<void> => {
      if (!pharmacien || pending) {
        return;
      }
      setPending(true);
      try {
        const updated = await commandesAPI.setStatut(
          pharmacien.id,
          commande.id,
          statut
        );
        setItems((previous) =>
          previous.map((row) => (row.id === commande.id ? updated : row))
        );
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => undefined);
        toast.success("Commande mise à jour.");
      } catch (err) {
        logger.error("Échec de la mise à jour de la commande.", err);
        toast.error(offlineAwareMessage(err, "Mise à jour impossible."));
      } finally {
        setPending(false);
      }
    },
    [pharmacien, pending, toast]
  );

  return (
    <Screen
      reserveMenuSpace
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commandes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/commande-new")}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Nouvelle commande"
        >
          <MaterialIcons name="add" size={22} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.tab, tab === entry.id && styles.tabActive]}
            onPress={() => {
              setLoading(true);
              setTab(entry.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Commandes ${entry.label.toLowerCase()}`}
          >
            <Text
              style={[
                styles.tabText,
                tab === entry.id && styles.tabTextActive,
              ]}
            >
              {entry.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommandeCard
              item={item}
              tab={tab}
              pending={pending}
              onAction={(row, statut) => void handleStatut(row, statut)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="shopping-cart"
              title={
                tab === "recues"
                  ? "Aucune commande reçue"
                  : "Aucune commande émise"
              }
              message={
                tab === "emises"
                  ? "Recherchez un médicament dans les autres pharmacies pour commander."
                  : undefined
              }
              actionLabel={
                tab === "emises" ? "Commander" : undefined
              }
              onAction={
                tab === "emises"
                  ? () => router.push("/commande-new")
                  : undefined
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  tabTextActive: {
    color: colors.primary,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
