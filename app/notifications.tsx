import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FilterChip } from "./components/FilterChip";
import { SwipeableAlertRow } from "./components/SwipeableAlertRow";
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
import { notificationsAPI, type NotificationPharmacien } from "./lib/api";
import {
  detectNewIds,
  filterAlerts,
  groupByDay,
  groupByMedicament,
} from "./lib/alerts";
import { logger } from "./lib/logger";
import { useDebouncedValue } from "./lib/useDebouncedValue";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { offlineAwareMessage } from "./lib/offline";

const FILTERS = [
  { id: "", label: "Toutes" },
  { id: "non_lue", label: "Nouvelles" },
  { id: "lue", label: "Lues" },
  { id: "traitee", label: "Traitées" },
] as const;

type GroupMode = "flat" | "day" | "medicament";

const GROUP_MODES: { id: GroupMode; label: string }[] = [
  { id: "flat", label: "Liste" },
  { id: "day", label: "Par jour" },
  { id: "medicament", label: "Par médicament" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  const [items, setItems] = useState<NotificationPharmacien[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [groupMode, setGroupMode] = useState<GroupMode>("day");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const knownIds = useRef<Set<string> | null>(null);

  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  // Pur : ne touche pas l'état (mises à jour dans `settle`/`fail`,
  // appelés depuis les continuations de promesse).
  const fetchItems = useCallback((): Promise<NotificationPharmacien[]> => {
    if (!pharmacien?.pharmacieId) {
      return Promise.resolve([]);
    }
    return notificationsAPI
      .list(pharmacien.id, pharmacien.pharmacieId, filter || undefined)
      .then(({ data }) => data);
  }, [pharmacien, filter]);

  const settle = useCallback((data: NotificationPharmacien[]): void => {
    // Arrivées depuis le dernier chargement : haptique (pas au 1er).
    if (knownIds.current === null) {
      knownIds.current = new Set(data.map((item) => item.id));
    } else {
      const fresh = detectNewIds(knownIds.current, data);
      knownIds.current = new Set(data.map((item) => item.id));
      if (fresh.length > 0) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => undefined);
      }
    }
    setItems(data);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fail = useCallback((err: unknown): void => {
    logger.error("Échec du chargement des notifications.", err);
    setError(
      offlineAwareMessage(err, "Impossible de charger les alertes.")
    );
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

  // Resynchronisation à chaque retour sur l'écran.
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

  const handlePress = useCallback(
    (item: NotificationPharmacien): void => {
      router.push(`/notification-details/${item.id}`);
    },
    [router]
  );

  const handleSetStatut = useCallback(
    async (
      item: NotificationPharmacien,
      statut: "lue" | "traitee",
      successMessage: string
    ): Promise<void> => {
      if (!pharmacien) {
        return;
      }
      try {
        const updated = await notificationsAPI.setStatut(
          pharmacien.id,
          item.id,
          statut
        );
        setItems((previous) =>
          previous.map((row) => (row.id === item.id ? updated : row))
        );
        toast.success(successMessage);
      } catch (err) {
        logger.error("Échec de la mise à jour de l'alerte.", err);
        toast.error(offlineAwareMessage(err, "Mise à jour impossible."));
      }
    },
    [pharmacien, toast]
  );

  const handleStock = useCallback(
    (item: NotificationPharmacien): void => {
      router.push({ pathname: "/stock", params: { q: item.medicamentNom } });
    },
    [router]
  );

  const handleMarkAllRead = useCallback(async (): Promise<void> => {
    if (!pharmacien) {
      return;
    }
    const unread = items.filter((item) => item.statut === "non_lue");
    if (unread.length === 0) {
      return;
    }
    try {
      await Promise.all(
        unread.map((item) =>
          notificationsAPI.setStatut(pharmacien.id, item.id, "lue")
        )
      );
      setItems((previous) =>
        previous.map((item) =>
          item.statut === "non_lue" ? { ...item, statut: "lue" } : item
        )
      );
      toast.success("Toutes les alertes sont marquées comme lues.");
    } catch (err) {
      logger.error("Échec du marquage global.", err);
      toast.error(offlineAwareMessage(err, "Marquage impossible. Réessayez."));
    }
  }, [items, pharmacien, toast]);

  const visible = useMemo(
    () => filterAlerts(items, debouncedQuery),
    [items, debouncedQuery]
  );

  const sections = useMemo(() => {
    if (groupMode === "day") {
      return groupByDay(visible).map((group) => ({
        title: group.label,
        subtitle: undefined as string | undefined,
        data: group.items,
      }));
    }
    if (groupMode === "medicament") {
      return groupByMedicament(visible).map((group) => ({
        title: group.medicamentNom,
        subtitle: `${group.count} alerte${group.count > 1 ? "s" : ""}${
          group.unread > 0 ? ` • ${group.unread} non lue${group.unread > 1 ? "s" : ""}` : ""
        }`,
        data: group.items,
      }));
    }
    return [
      {
        title: "",
        subtitle: undefined as string | undefined,
        data: visible,
      },
    ];
  }, [visible, groupMode]);

  return (
    <Screen
      reserveMenuSpace
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alertes de recherche</Text>
        <TouchableOpacity
          onPress={() => void handleMarkAllRead()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Tout marquer comme lu"
        >
          <Text style={styles.markAll}>Tout marquer lu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.search}>
        <AppTextField
          label="Rechercher une alerte"
          placeholder="Médicament, message…"
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
            onPress={() => {
              setLoading(true);
              setFilter(entry.id);
            }}
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
        {GROUP_MODES.map((entry) => (
          <FilterChip
            key={entry.id}
            label={entry.label}
            selected={groupMode === entry.id}
            onPress={() => setGroupMode(entry.id)}
            accessibilityLabel={`Regrouper : ${entry.label}`}
          />
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : (
        <SectionList
          style={styles.grow}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SwipeableAlertRow
              item={item}
              onPress={handlePress}
              onMarkRead={(row) =>
                void handleSetStatut(row, "lue", "Alerte marquée comme lue.")
              }
              onMarkDone={(row) =>
                void handleSetStatut(row, "traitee", "Alerte traitée.")
              }
              onStock={handleStock}
            />
          )}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.subtitle ? (
                  <Text style={styles.sectionSubtitle}>
                    {section.subtitle}
                  </Text>
                ) : null}
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-none"
              title={
                debouncedQuery
                  ? "Aucune alerte ne correspond"
                  : "Aucune alerte"
              }
              message={
                debouncedQuery
                  ? "Essayez un autre mot-clé."
                  : "Quand un patient recherchera un de vos médicaments dans Meditrouv, vous serez notifié ici et sur WhatsApp."
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
  markAll: {
    fontSize: fontSize.md,
    color: colors.primaryDark,
    textDecorationLine: "underline",
  },
  search: {
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
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  sectionHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
