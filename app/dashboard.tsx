import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DemandeCard } from "./components/DemandeCard";
import { FilterChip } from "./components/FilterChip";
import StatCard from "./components/StatCard";
import { TrendChart } from "./components/TrendChart";
import {
  AppButton,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  colors,
  fontSize,
  spacing,
} from "./components/ui";
import {
  demandesAPI,
  notificationsAPI,
  pharmacienAPI,
  type DashboardStats,
  type DemandeInter,
  type NotificationPharmacien,
} from "./lib/api";
import { logger } from "./lib/logger";
import { offlineAwareMessage } from "./lib/offline";
import { bucketByDay } from "./lib/trends";
import { usePharmacienSession } from "./lib/usePharmacienSession";

const TREND_PERIODS = [
  { id: 7, label: "7 jours" },
  { id: 30, label: "30 jours" },
] as const;

// Aperçu des requêtes inter-pharmacies (reçues + émises, récentes d'abord).
const RECENT_DEMANDES_LIMIT = 5;

export default function DashboardScreen() {
  const router = useRouter();
  const { pharmacien, isReady } = usePharmacienSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendItems, setTrendItems] = useState<NotificationPharmacien[]>([]);
  const [recentDemandes, setRecentDemandes] = useState<DemandeInter[]>([]);
  const [trendDays, setTrendDays] = useState<number>(7);
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
  // Dépend des identifiants (stables), pas de l'objet profil : chaque
  // rafraîchissement de session crée une nouvelle identité d'objet qui
  // re-déclencherait sinon ce chargement en boucle.
  const pharmacienId = pharmacien?.id;
  const pharmacieId = pharmacien?.pharmacieId;
  const fetchStats = useCallback((): Promise<{
    stats: DashboardStats | null;
    trend: NotificationPharmacien[];
    demandes: DemandeInter[];
  }> => {
    if (!pharmacienId || !pharmacieId) {
      return Promise.resolve({ stats: null, trend: [], demandes: [] });
    }
    return Promise.all([
      pharmacienAPI.dashboard(pharmacienId, pharmacieId),
      // Tendances : la liste complète nourrit le graphique (échec = vide).
      notificationsAPI
        .list(pharmacienId, pharmacieId)
        .then(({ data }) => data)
        .catch((error: unknown) => {
          logger.warn("Tendances indisponibles.", error);
          return [] as NotificationPharmacien[];
        }),
      // Aperçu accueil : dernières requêtes inter-pharmacies (échec = vide,
      // jamais bloquant pour le reste du tableau de bord).
      demandesAPI
        .list(pharmacienId, pharmacieId, "all", RECENT_DEMANDES_LIMIT)
        .catch((error: unknown) => {
          logger.warn("Requêtes récentes indisponibles.", error);
          return [] as DemandeInter[];
        }),
    ]).then(([stats, trend, demandes]) => ({ stats, trend, demandes }));
  }, [pharmacienId, pharmacieId]);

  const settle = useCallback(
    (data: {
      stats: DashboardStats | null;
      trend: NotificationPharmacien[];
      demandes: DemandeInter[];
    }): void => {
      setStats(data.stats);
      setTrendItems(data.trend);
      setRecentDemandes(data.demandes);
      setError(null);
      setLoading(false);
      setRefreshing(false);
    },
    []
  );

  const fail = useCallback((err: unknown): void => {
    logger.error("Échec du chargement du tableau de bord.", err);
    setError(
      offlineAwareMessage(err, "Impossible de charger le tableau de bord.")
    );
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    let cancelled = false;
    fetchStats()
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
  }, [isReady, fetchStats, settle, fail]);

  const reload = useCallback((): void => {
    fetchStats().then(settle).catch(fail);
  }, [fetchStats, settle, fail]);

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    reload();
  }, [reload]);

  const handleRetry = useCallback((): void => {
    setLoading(true);
    reload();
  }, [reload]);

  const trendBuckets = useMemo(
    () => bucketByDay(trendItems, trendDays),
    [trendItems, trendDays]
  );

  if (!isReady || loading) {
    return (
      <Screen>
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (!pharmacien?.pharmacieId) {
    return (
      <Screen>
        <View style={styles.center}>
          <MaterialIcons name="hourglass-empty" size={48} color={colors.warning} />
          <Text style={styles.title}>Compte en attente de rattachement</Text>
          <Text style={styles.subtitle}>
            Votre compte n&apos;est pas encore lié à une pharmacie. Un
            administrateur va le valider, ou contactez le support.
          </Text>
          <AppButton
            title="Voir mon profil"
            onPress={() => router.push("/profil")}
            variant="secondary"
            accessibilityLabel="Voir mon profil"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      reserveMenuSpace
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>
            Bonjour, {pharmacien.nomPharmacienTitulaire}
          </Text>
          <Text style={styles.pharmacie}>
            {pharmacien.pharmacie?.nomPharmacie ??
              pharmacien.nomPharmacie ??
              "Ma pharmacie"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/profil")}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Voir mon profil"
        >
          <MaterialIcons
            name="account-circle"
            size={30}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : (
          stats && (
            <>
              <View style={styles.statsRow}>
                <StatCard
                  icon="notifications"
                  value={stats.notifications.unread}
                  label="Alertes non lues"
                  color={colors.danger}
                  onPress={() => router.push("/notifications")}
                />
                <View style={styles.statsGap} />
                <StatCard
                  icon="inventory"
                  value={stats.stock.medicaments}
                  label="Médicaments"
                  color={colors.primary}
                  onPress={() => router.push("/stock")}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  icon="warning"
                  value={stats.stock.ruptures + stats.stock.faibles}
                  label="Ruptures / faibles"
                  color={colors.warning}
                  onPress={() => router.push("/stock")}
                />
                <View style={styles.statsGap} />
                <StatCard
                  icon="shopping-cart"
                  value={
                    stats.commandes.recuesEnAttente +
                    stats.commandes.emisesEnAttente
                  }
                  label="Commandes en attente"
                  color={colors.info}
                  onPress={() => router.push("/commandes")}
                />
              </View>
              <AppButton
                title="Requêtes inter-pharmacies"
                icon="campaign"
                onPress={() => router.push("/demandes")}
                fullWidth
                accessibilityLabel="Requêtes inter-pharmacies"
              />

              <Text style={styles.sectionTitle}>Alertes reçues</Text>
              <View style={styles.trendCard}>
                <View style={styles.trendPeriods}>
                  {TREND_PERIODS.map((period) => (
                    <FilterChip
                      key={period.id}
                      label={period.label}
                      selected={trendDays === period.id}
                      onPress={() => setTrendDays(period.id)}
                      tone="light"
                      accessibilityLabel={`Tendances : ${period.label}`}
                    />
                  ))}
                </View>
                <TrendChart
                  buckets={trendBuckets}
                  title={`Alertes (${trendDays} derniers jours)`}
                />
              </View>

              <Text style={styles.sectionTitle}>Dernières requêtes</Text>
              {recentDemandes.length === 0 ? (
                <EmptyState
                  icon="campaign"
                  title="Aucune requête pour le moment"
                  message="Les requêtes inter-pharmacies reçues et émises apparaîtront ici."
                />
              ) : (
                recentDemandes.map((item) => (
                  <DemandeCard
                    key={item.id}
                    item={item}
                    tab={
                      item.pharmacieDemandeuseId === pharmacien.pharmacieId
                        ? "emises"
                        : "recues"
                    }
                    onPress={(pressed) =>
                      router.push(`/demande-details/${pressed.id}`)
                    }
                  />
                ))
              )}
            </>
          )
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  header: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcome: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  pharmacie: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  statsGap: {
    width: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  trendPeriods: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
});
