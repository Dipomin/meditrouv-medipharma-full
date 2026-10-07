import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PropositionSheet } from "../components/PropositionSheet";
import {
  AppButton,
  AppHeader,
  ErrorState,
  Screen,
  Skeleton,
  colors,
  fontSize,
  radius,
  spacing,
  useToast,
} from "../components/ui";
import {
  demandesAPI,
  type DemandeInter,
  type PropositionDemande,
} from "../lib/api";
import {
  canRespond,
  compteurPropositions,
  demandeStatutMeta,
  formatPrix,
  isUrgentDemande,
  lignePropositionTotal,
} from "../lib/demandes";
import { logger } from "../lib/logger";
import { usePharmacienSession } from "../lib/usePharmacienSession";
import { offlineAwareMessage } from "../lib/offline";

const chiffres = (value: string): string => value.replace(/\D/g, "");

export default function DemandeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  const [demande, setDemande] = useState<DemandeInter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  // Pur : ne touche pas l'état (mises à jour dans `settle`/`fail`,
  // appelés depuis les continuations de promesse).
  const fetchDemande = useCallback((): Promise<DemandeInter | null> => {
    if (!pharmacien || !id) {
      return Promise.resolve(null);
    }
    return demandesAPI.getById(pharmacien.id, id);
  }, [pharmacien, id]);

  const settle = useCallback((data: DemandeInter | null): void => {
    if (data) {
      setDemande(data);
      setError(null);
    }
    setLoading(false);
  }, []);

  const fail = useCallback((err: unknown): void => {
    logger.error("Échec du chargement de la requête.", err);
    setError(offlineAwareMessage(err, "Impossible de charger la requête."));
    setLoading(false);
  }, []);

  const load = useCallback((): void => {
    fetchDemande().then(settle).catch(fail);
  }, [fetchDemande, settle, fail]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    let cancelled = false;
    fetchDemande()
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
  }, [isReady, fetchDemande, settle, fail]);

  const handleCall = useCallback(
    (telephone: string | null): void => {
      if (!telephone) {
        toast.info("Aucun contact renseigné.");
        return;
      }
      Linking.openURL(`tel:${chiffres(telephone)}`).catch(() => {
        toast.error("Appel impossible depuis cet appareil.");
      });
    },
    [toast]
  );

  const handleWhatsApp = useCallback(
    (telephone: string | null): void => {
      const digits = chiffres(telephone ?? "");
      if (!digits) {
        toast.info("Aucun contact renseigné.");
        return;
      }
      Linking.openURL(`https://wa.me/${digits}`).catch(() => {
        toast.error("Ouverture de WhatsApp impossible.");
      });
    },
    [toast]
  );

  const handleRespond = useCallback(
    async (data: {
      lignes: {
        medicamentNom: string;
        quantiteProposee: number;
        prixUnitaire: number | null;
        disponible: boolean;
        ligneDemandeId: string;
      }[];
      prixTotal: number | null;
      message?: string;
      telephoneContact?: string;
    }): Promise<void> => {
      if (!pharmacien || !id) {
        return;
      }
      setSending(true);
      try {
        const result = await demandesAPI.respond(pharmacien.id, id, data);
        toast.success(
          result.position !== null
            ? `Proposition envoyée (${result.position}/5).`
            : "Proposition envoyée."
        );
        setSheetOpen(false);
        load();
      } catch (err) {
        logger.error("Échec de l'envoi de la proposition.", err);
        toast.error(offlineAwareMessage(err, "Envoi impossible."));
      } finally {
        setSending(false);
      }
    },
    [pharmacien, id, toast, load]
  );

  const handleAnnuler = useCallback((): void => {
    if (!pharmacien || !id) {
      return;
    }
    Alert.alert("Annuler", "Annuler définitivement cette requête ?", [
      { text: "Retour", style: "cancel" },
      {
        text: "Annuler la requête",
        style: "destructive",
        onPress: () => {
          demandesAPI
            .annuler(pharmacien.id, id as string)
            .then(() => {
              toast.success("Requête annulée.");
              void load();
            })
            .catch((error: unknown) => {
              logger.error("Échec de l'annulation.", error);
              toast.error(
                offlineAwareMessage(error, "Annulation impossible.")
              );
            });
        },
      },
    ]);
  }, [pharmacien, id, toast, load]);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Requête" />
        <View style={styles.loadingContent}>
          <Skeleton width="70%" height={24} />
          <View style={styles.gap} />
          <Skeleton width="100%" height={16} />
          <View style={styles.gap} />
          <Skeleton width="90%" height={16} />
        </View>
      </Screen>
    );
  }

  if (error || !demande) {
    return (
      <Screen>
        <AppHeader title="Requête" />
        <ErrorState
          message={error ?? "Requête introuvable."}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        />
      </Screen>
    );
  }

  const meta = demandeStatutMeta(demande.statut);
  const urgent = isUrgentDemande(demande.urgence);
  const estMienne =
    pharmacien?.pharmacieId === demande.pharmacieDemandeuseId;
  const maProposition: PropositionDemande | null = estMienne
    ? null
    : (demande.propositions.find(
        (proposition) =>
          proposition.pharmacieId === pharmacien?.pharmacieId
      ) ?? null);
  const eligible =
    !estMienne &&
    canRespond({
      statut: demande.statut,
      expiresAt: demande.expiresAt,
      pharmacieDemandeuseId: demande.pharmacieDemandeuseId,
      maPharmacieId: pharmacien?.pharmacieId,
      dejaRepondu: maProposition !== null,
      propositionsCount: demande.propositionsCount,
    });

  return (
    <Screen>
      <AppHeader title={estMienne ? "Ma requête" : "Requête reçue"} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <MaterialIcons
              name="campaign"
              size={28}
              color={colors.primary}
            />
            <Text style={[styles.statut, { color: meta.color }]}>
              {meta.label} • {compteurPropositions(demande.propositionsCount)}
            </Text>
          </View>
          {urgent && (
            <View style={styles.urgentBanner}>
              <MaterialIcons
                name="warning"
                size={16}
                color={colors.surface}
              />
              <Text style={styles.urgentText}>REQUÊTE URGENTE</Text>
            </View>
          )}
          {!estMienne && (
            <Text style={styles.demandeur}>
              Demandée par {demande.nomPharmacieDemandeuse ?? "une pharmacie"}
            </Text>
          )}
          {demande.lignes.map((ligne) => (
            <Text key={ligne.id} style={styles.ligne}>
              {ligne.quantite}x {ligne.medicamentNom}
            </Text>
          ))}
          {demande.notes ? (
            <Text style={styles.notes}>{demande.notes}</Text>
          ) : null}
          <View style={styles.metaBox}>
            <Text style={styles.meta}>
              Reçue le {new Date(demande.createdAt).toLocaleString("fr-FR")}
            </Text>
            <Text style={styles.meta}>
              Expire le {new Date(demande.expiresAt).toLocaleString("fr-FR")}
            </Text>
            {!estMienne && demande.telephoneContact && (
              <Text style={styles.meta}>
                Contact demandeur : {demande.telephoneContact}
              </Text>
            )}
          </View>
        </View>

        {estMienne ? (
          <>
            <Text style={styles.section}>Propositions reçues</Text>
            {demande.propositions.length === 0 ? (
              <Text style={styles.vide}>
                Aucune proposition pour le moment. Les 5 premières vous
                parviendront ici et sur WhatsApp.
              </Text>
            ) : (
              demande.propositions.map((proposition, index) => (
                <View key={proposition.id} style={styles.card}>
                  <View style={styles.propoHeader}>
                    <Text style={styles.propoPharmacie} numberOfLines={1}>
                      {proposition.nomPharmacie ?? "Pharmacie"}
                    </Text>
                    <Text style={styles.propoRang}>#{index + 1}</Text>
                  </View>
                  {proposition.lignes.map((ligne) => {
                    const total = lignePropositionTotal(ligne);
                    return (
                      <Text key={ligne.id} style={styles.ligne}>
                        {ligne.quantiteProposee}x {ligne.medicamentNom}
                        {" — "}
                        {formatPrix(ligne.prixUnitaire)}
                        {total !== null && ligne.prixUnitaire !== null
                          ? ` (= ${total} F)`
                          : ""}
                      </Text>
                    );
                  })}
                  {proposition.prixTotal !== null && (
                    <Text style={styles.total}>
                      Total proposé : {proposition.prixTotal} F
                    </Text>
                  )}
                  {proposition.message ? (
                    <Text style={styles.notes}>{proposition.message}</Text>
                  ) : null}
                  <Text style={styles.contact}>
                    Contact : {proposition.telephoneContact ?? "—"}
                  </Text>
                  <View style={styles.actions}>
                    <AppButton
                      title="Appeler"
                      icon="call"
                      onPress={() =>
                        handleCall(proposition.telephoneContact)
                      }
                      style={styles.actionButton}
                      accessibilityLabel="Appeler la pharmacie"
                    />
                    <AppButton
                      title="WhatsApp"
                      icon="chat"
                      variant="secondary"
                      onPress={() =>
                        handleWhatsApp(proposition.telephoneContact)
                      }
                      style={styles.actionButton}
                      accessibilityLabel="Contacter sur WhatsApp"
                    />
                  </View>
                </View>
              ))
            )}
            {demande.statut === "ouverte" && (
              <AppButton
                title="Annuler la requête"
                variant="danger"
                onPress={handleAnnuler}
                fullWidth
                style={styles.annuler}
                accessibilityLabel="Annuler la requête"
              />
            )}
          </>
        ) : (
          <>
            {maProposition ? (
              <>
                <Text style={styles.section}>Ma proposition envoyée</Text>
                <View style={styles.card}>
                  {maProposition.lignes.map((ligne) => (
                    <Text key={ligne.id} style={styles.ligne}>
                      {ligne.quantiteProposee}x {ligne.medicamentNom}
                      {" — "}
                      {formatPrix(ligne.prixUnitaire)}
                    </Text>
                  ))}
                  {maProposition.prixTotal !== null && (
                    <Text style={styles.total}>
                      Total proposé : {maProposition.prixTotal} F
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <AppButton
                title={
                  eligible
                    ? "Répondre avec ma cotation"
                    : demande.statut !== "ouverte"
                      ? `Requête ${meta.label.toLowerCase()}`
                      : "Réponse impossible"
                }
                icon="reply"
                onPress={() => setSheetOpen(true)}
                disabled={!eligible}
                fullWidth
                style={styles.repondre}
                accessibilityLabel="Répondre avec ma cotation"
              />
            )}
          </>
        )}
      </ScrollView>

      {sheetOpen && (
        <PropositionSheet
          key={demande.id}
          lignes={demande.lignes}
          sending={sending}
          telephoneDefaut={pharmacien?.whatsapp}
          onClose={() => setSheetOpen(false)}
          onConfirm={(data) => void handleRespond(data)}
        />
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
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statut: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginLeft: spacing.sm + 2,
    flex: 1,
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
  demandeur: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  ligne: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  notes: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  section: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  vide: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  propoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  propoPharmacie: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  propoRang: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  total: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.accentText,
    marginTop: spacing.sm,
  },
  contact: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  annuler: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  repondre: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
