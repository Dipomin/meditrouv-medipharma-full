import { MaterialIcons } from "@expo/vector-icons";
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

import { DemandeCard } from "./components/DemandeCard";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  colors,
  fontSize,
  minTouchTarget,
  spacing,
} from "./components/ui";
import { demandesAPI, type DemandeInter } from "./lib/api";
import { logger } from "./lib/logger";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { offlineAwareMessage } from "./lib/offline";

const TABS = [
  { id: "recues", label: "Reçues" },
  { id: "emises", label: "Émises" },
] as const;

export default function DemandesScreen() {
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { pharmacien, isReady } = usePharmacienSession();
  // Onglet initial pilotable par deep-link (`?tab=emises`).
  const [tab, setTab] = useState<"recues" | "emises">(
    tabParam === "emises" ? "emises" : "recues"
  );
  const [items, setItems] = useState<DemandeInter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  // Pur : ne touche pas l'état (mises à jour dans `settle`/`fail`,
  // appelés depuis les continuations de promesse).
  const fetchDemandes = useCallback((): Promise<DemandeInter[]> => {
    if (!pharmacien?.pharmacieId) {
      return Promise.resolve([]);
    }
    return demandesAPI.list(pharmacien.id, pharmacien.pharmacieId, tab);
  }, [pharmacien, tab]);

  const settle = useCallback((data: DemandeInter[]): void => {
    setItems(data);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fail = useCallback((err: unknown): void => {
    logger.error("Échec du chargement des requêtes.", err);
    setError(
      offlineAwareMessage(err, "Impossible de charger les requêtes.")
    );
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    let cancelled = false;
    fetchDemandes()
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
  }, [isReady, fetchDemandes, settle, fail]);

  const reload = useCallback((): void => {
    fetchDemandes().then(settle).catch(fail);
  }, [fetchDemandes, settle, fail]);

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const handleRetry = useCallback((): void => {
    setLoading(true);
    reload();
  }, [reload]);

  const handlePress = useCallback(
    (item: DemandeInter): void => {
      router.push(`/demande-details/${item.id}`);
    },
    [router]
  );

  return (
    <Screen reserveMenuSpace>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Requêtes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/demande-new")}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Nouvelle requête"
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
            accessibilityLabel={`Requêtes ${entry.label.toLowerCase()}`}
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
            <DemandeCard item={item} tab={tab} onPress={handlePress} />
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
              icon="campaign"
              title={
                tab === "recues"
                  ? "Aucune requête reçue"
                  : "Aucune requête émise"
              }
              message={
                tab === "emises"
                  ? "Diffusez un besoin multi-médicaments à toutes les pharmacies."
                  : "Les requêtes des autres pharmacies apparaîtront ici."
              }
              actionLabel={tab === "emises" ? "Nouvelle requête" : undefined}
              onAction={
                tab === "emises"
                  ? () => router.push("/demande-new")
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
