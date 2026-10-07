import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FilterChip } from "./components/FilterChip";
import StockCard from "./components/StockCard";
import {
  AppTextField,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  colors,
  fontSize,
  spacing,
  useToast,
} from "./components/ui";
import { stockAPI, type Medicament } from "./lib/api";
import { logger } from "./lib/logger";
import { filterStockLocal, sortStock, type StockSort } from "./lib/stock";
import { useDebouncedValue } from "./lib/useDebouncedValue";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { offlineAwareMessage } from "./lib/offline";

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "rupture", label: "Ruptures" },
  { id: "faible", label: "Stocks faibles" },
] as const;

const SORTS: { id: StockSort; label: string }[] = [
  { id: "nom", label: "Nom A-Z" },
  { id: "qte-asc", label: "Qté ↑" },
  { id: "qte-desc", label: "Qté ↓" },
];

export default function StockScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  // Pré-remplissage depuis une alerte (« mettre à jour mon stock »).
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const [items, setItems] = useState<Medicament[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<StockSort>("nom");
  const [inventory, setInventory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  // Pur : ne touche pas l'état (mises à jour dans `settle`/`fail`,
  // appelés depuis les continuations de promesse).
  // Le stock complet est chargé une fois ; recherche et tris sont locaux.
  const fetchItems = useCallback((): Promise<Medicament[]> => {
    if (!pharmacien?.pharmacieId) {
      return Promise.resolve([]);
    }
    return stockAPI.list(pharmacien.pharmacieId);
  }, [pharmacien]);

  const settle = useCallback((data: Medicament[]): void => {
    setItems(data);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fail = useCallback((err: unknown): void => {
    logger.error("Échec du chargement du stock.", err);
    setError(offlineAwareMessage(err, "Impossible de charger le stock."));
    setLoading(false);
    setRefreshing(false);
  }, []);

  const reload = useCallback((): void => {
    fetchItems().then(settle).catch(fail);
  }, [fetchItems, settle, fail]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    let cancelled = false;
    fetchItems()
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
  }, [isReady, fetchItems, settle, fail]);

  // Resynchronisation à chaque retour (retour de fiche, autre appareil…).
  useFocusEffect(
    useCallback(() => {
      if (isReady && pharmacien) {
        reload();
      }
    }, [isReady, pharmacien, reload])
  );

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const handleRetry = useCallback((): void => {
    setLoading(true);
    reload();
  }, [reload]);

  const handleQuickAdd = useCallback(
    async (item: Medicament): Promise<void> => {
      if (!pharmacien) {
        return;
      }
      try {
        const updated = await stockAPI.update(pharmacien.id, item.id, {
          quantite: item.quantite + 10,
        });
        setItems((previous) =>
          previous.map((row) => (row.id === item.id ? updated : row))
        );
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => undefined);
        toast.success(`${item.nomMedicament} : +10 unités.`);
      } catch (err) {
        logger.error("Échec du réassort rapide.", err);
        toast.error(offlineAwareMessage(err, "Réassort impossible."));
      }
    },
    [pharmacien, toast]
  );

  // Ajustement inventaire : optimiste, silencieux, avec repli si échec.
  const handleAdjust = useCallback(
    async (item: Medicament, delta: number): Promise<void> => {
      if (!pharmacien || adjustingId) {
        return;
      }
      const next = Math.max(0, item.quantite + delta);
      if (next === item.quantite) {
        return;
      }
      setAdjustingId(item.id);
      setItems((previous) =>
        previous.map((row) =>
          row.id === item.id ? { ...row, quantite: next } : row
        )
      );
      try {
        const updated = await stockAPI.update(pharmacien.id, item.id, {
          quantite: next,
        });
        setItems((previous) =>
          previous.map((row) => (row.id === item.id ? updated : row))
        );
        void Haptics.selectionAsync().catch(() => undefined);
      } catch (err) {
        logger.error("Échec de l'ajustement.", err);
        setItems((previous) =>
          previous.map((row) => (row.id === item.id ? item : row))
        );
        toast.error(offlineAwareMessage(err, "Ajustement impossible."));
      } finally {
        setAdjustingId(null);
      }
    },
    [pharmacien, adjustingId, toast]
  );

  const visible = useMemo(() => {
    const searched = filterStockLocal(items, debouncedQuery);
    const filtered = searched.filter((item) => {
      if (filter === "rupture") {
        return item.quantite <= 0;
      }
      if (filter === "faible") {
        return item.quantite > 0 && item.quantite <= 5;
      }
      return true;
    });
    return sortStock(filtered, sort);
  }, [items, debouncedQuery, filter, sort]);

  return (
    <Screen
      reserveMenuSpace
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon stock</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.inventoryButton,
              inventory && styles.inventoryButtonActive,
            ]}
            onPress={() => setInventory((previous) => !previous)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Mode inventaire rapide"
            accessibilityState={{ selected: inventory }}
          >
            <MaterialIcons
              name="playlist-add-check"
              size={22}
              color={inventory ? colors.surface : colors.primaryDark}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/stock-new")}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un médicament"
          >
            <MaterialIcons name="add" size={22} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <AppTextField
          label="Rechercher dans mon stock"
          placeholder="Nom, description…"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          leftIcon="search"
          containerStyle={styles.searchField}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTERS.map((entry) => (
          <FilterChip
            key={entry.id}
            label={entry.label}
            selected={filter === entry.id}
            onPress={() => setFilter(entry.id)}
            accessibilityLabel={`Filtrer : ${entry.label}`}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {SORTS.map((entry) => (
          <FilterChip
            key={entry.id}
            label={entry.label}
            selected={sort === entry.id}
            onPress={() => setSort(entry.id)}
            accessibilityLabel={`Trier : ${entry.label}`}
          />
        ))}
      </ScrollView>
      {inventory && (
        <Text style={styles.inventoryHint}>
          Mode inventaire : ajustez les quantités au fil du comptage.
        </Text>
      )}

      {loading && !refreshing ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : (
        <FlatList
          style={styles.grow}
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StockCard
              item={item}
              onPress={(row) => router.push(`/stock-edit/${row.id}`)}
              onQuickAdd={(row) => void handleQuickAdd(row)}
              onAdjust={inventory ? (row, delta) => void handleAdjust(row, delta) : undefined}
              compact={inventory}
              adjusting={adjustingId === item.id}
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
              icon="inventory-2"
              title={
                debouncedQuery || filter !== "all"
                  ? "Aucun médicament ne correspond"
                  : "Aucun médicament dans votre stock"
              }
              message={
                debouncedQuery || filter !== "all"
                  ? "Modifiez la recherche ou les filtres."
                  : "Ajoutez vos références pour apparaître dans les recherches des patients."
              }
              actionLabel={
                debouncedQuery || filter !== "all"
                  ? undefined
                  : "Ajouter un médicament"
              }
              onAction={
                debouncedQuery || filter !== "all"
                  ? undefined
                  : () => router.push("/stock-new")
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
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
  headerActions: {
    flexDirection: "row",
  },
  inventoryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  inventoryButtonActive: {
    backgroundColor: colors.accentText,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
  },
  searchField: {
    marginBottom: spacing.sm,
  },
  chipsScroll: {
    // Neutralise le flexGrow:1 natif du ScrollView : la ligne épouse
    // son contenu au lieu de partager l'espace restant.
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  inventoryHint: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    color: colors.surface,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
