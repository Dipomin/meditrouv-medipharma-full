import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AppButton,
  AppHeader,
  Screen,
  Skeleton,
  colors,
  fontSize,
  radius,
  spacing,
  useToast,
} from "../components/ui";
import { notificationsAPI, type NotificationPharmacien } from "../lib/api";
import { logger } from "../lib/logger";
import { usePharmacienSession } from "../lib/usePharmacienSession";
import { offlineAwareMessage } from "../lib/offline";

export default function NotificationDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  const [item, setItem] = useState<NotificationPharmacien | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      if (!pharmacien || !id) {
        return;
      }
      try {
        const data = await notificationsAPI.getById(pharmacien.id, id);
        if (cancelled) {
          return;
        }
        setItem(data);
        // Ouverture = marquage « lue » automatique.
        if (data.statut === "non_lue") {
          try {
            const updated = await notificationsAPI.setStatut(
              pharmacien.id,
              id,
              "lue"
            );
            if (!cancelled) {
              setItem(updated);
            }
          } catch (error) {
            logger.warn("Marquage automatique impossible.", error);
          }
        }
      } catch (error) {
        logger.error("Échec du chargement de l'alerte.", error);
        if (!cancelled) {
          toast.error(offlineAwareMessage(error, "Impossible de charger cette alerte."));
          router.back();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    if (isReady && pharmacien) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [isReady, pharmacien, id, router, toast]);

  const handleStatut = useCallback(
    async (
      statut: "lue" | "traitee",
      successMessage: string
    ): Promise<void> => {
      if (!pharmacien || !id) {
        return;
      }
      try {
        const updated = await notificationsAPI.setStatut(
          pharmacien.id,
          id,
          statut
        );
        setItem(updated);
        toast.success(successMessage);
      } catch (error) {
        logger.error("Échec de la mise à jour.", error);
        toast.error(offlineAwareMessage(error, "Mise à jour impossible."));
      }
    },
    [pharmacien, id, toast]
  );

  const handleDelete = useCallback((): void => {
    if (!pharmacien || !id) {
      return;
    }
    // Destructif : confirmation native conservée.
    Alert.alert("Supprimer", "Supprimer définitivement cette alerte ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          notificationsAPI
            .remove(pharmacien.id, id)
            .then(() => {
              toast.success("Alerte supprimée.");
              router.back();
            })
            .catch((error: unknown) => {
              logger.error("Échec de la suppression.", error);
              toast.error(
                offlineAwareMessage(error, "Suppression impossible.")
              );
            });
        },
      },
    ]);
  }, [pharmacien, id, router, toast]);

  return (
    <Screen>
      <AppHeader title="Détail de l'alerte" />

      {loading || !item ? (
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Skeleton width="70%" height={24} />
          <View style={styles.gap} />
          <Skeleton width="100%" height={16} />
          <View style={styles.gap} />
          <Skeleton width="90%" height={16} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <MaterialIcons
                name="notifications-active"
                size={28}
                color={colors.primary}
              />
              <Text style={styles.medicament}>{item.medicamentNom}</Text>
            </View>
            <Text style={styles.message}>{item.message}</Text>

            <View style={styles.metaBox}>
              <Text style={styles.meta}>
                Recherche : {item.recherche?.query ?? "—"}
                {item.recherche?.commune
                  ? ` (${item.recherche.commune})`
                  : ""}
              </Text>
              <Text style={styles.meta}>
                Reçue le{" "}
                {new Date(item.createdAt).toLocaleString("fr-FR")}
              </Text>
              <Text style={styles.meta}>
                WhatsApp : {item.whatsappSent ? "envoyé" : "non envoyé"}
              </Text>
              <Text style={styles.meta}>Statut : {item.statut}</Text>
            </View>

            {item.demandeId ? (
              <AppButton
                title="Voir la requête"
                onPress={() =>
                  router.push(`/demande-details/${item.demandeId}`)
                }
                icon="campaign"
                fullWidth
                style={styles.stockButton}
                accessibilityLabel="Voir la requête"
              />
            ) : (
              <AppButton
                title="Mettre à jour mon stock"
                onPress={() =>
                  router.push({
                    pathname: "/stock",
                    params: { q: item.medicamentNom },
                  })
                }
                icon="inventory"
                fullWidth
                style={styles.stockButton}
                accessibilityLabel="Mettre à jour mon stock"
              />
            )}

            <View style={styles.actions}>
              {item.statut !== "traitee" ? (
                <AppButton
                  title="Marquer traitée"
                  onPress={() =>
                    void handleStatut("traitee", "Alerte traitée.")
                  }
                  style={styles.actionButton}
                  accessibilityLabel="Marquer comme traitée"
                />
              ) : (
                <AppButton
                  title="Rouvrir"
                  onPress={() => void handleStatut("lue", "Alerte rouverte.")}
                  variant="secondary"
                  style={styles.actionButton}
                  accessibilityLabel="Rouvrir l'alerte"
                />
              )}
              <AppButton
                title="Supprimer"
                onPress={handleDelete}
                variant="danger"
                style={styles.actionButton}
                accessibilityLabel="Supprimer l'alerte"
              />
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContent: {
    padding: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  medicament: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  message: {
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: 24,
  },
  metaBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  meta: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stockButton: {
    marginTop: spacing.xl,
  },
  actions: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});
