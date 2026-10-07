import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AppButton,
  AppHeader,
  AppTextField,
  Screen,
  colors,
  fontSize,
  spacing,
  useToast,
} from "./components/ui";
import { demandesAPI } from "./lib/api";
import { logger } from "./lib/logger";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { offlineAwareMessage } from "./lib/offline";

const LIGNES_MAX = 10;

type LigneDraft = {
  key: string;
  nom: string;
  quantite: number;
};

const nouvelleLigne = (): LigneDraft => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  nom: "",
  quantite: 1,
});

export default function DemandeNewScreen() {
  const router = useRouter();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  const [lignes, setLignes] = useState<LigneDraft[]>([nouvelleLigne()]);
  const [urgente, setUrgente] = useState(false);
  const [notes, setNotes] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  const patch = (key: string, part: Partial<LigneDraft>): void => {
    setLignes((previous) =>
      previous.map((ligne) =>
        ligne.key === key ? { ...ligne, ...part } : ligne
      )
    );
  };

  const retirer = (key: string): void => {
    setLignes((previous) =>
      previous.length > 1
        ? previous.filter((ligne) => ligne.key !== key)
        : previous
    );
  };

  const handleSend = async (): Promise<void> => {
    if (!pharmacien?.pharmacieId) {
      toast.error("Compte non rattaché à une pharmacie.");
      return;
    }
    const nettoyees = lignes
      .map((ligne) => ({
        medicamentNom: ligne.nom.trim(),
        quantite: ligne.quantite,
      }))
      .filter((ligne) => ligne.medicamentNom.length > 0);
    if (nettoyees.length === 0) {
      toast.info("Ajoutez au moins un médicament en rupture.");
      return;
    }
    if (nettoyees.length > LIGNES_MAX) {
      toast.info(`Une requête est limitée à ${LIGNES_MAX} médicaments.`);
      return;
    }
    setSending(true);
    try {
      const result = await demandesAPI.create(pharmacien.id, {
        lignes: nettoyees,
        urgence: urgente ? "urgente" : "normale",
        notes: notes.trim() || undefined,
        // Contact saisi, sinon WhatsApp du compte par défaut.
        telephoneContact:
          telephone.trim() || pharmacien.whatsapp || undefined,
      });
      toast.success(
        `Requête diffusée à ${result.notified} pharmacie(s). ` +
          `Les 5 premières cotations vous parviendront ici et sur WhatsApp.`
      );
      router.replace({ pathname: "/demandes", params: { tab: "emises" } });
    } catch (error) {
      logger.error("Échec de la diffusion de la requête.", error);
      toast.error(offlineAwareMessage(error, "Diffusion impossible."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Nouvelle requête" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.explication}>
            Décrivez les médicaments en rupture : la requête est diffusée à
            toutes les pharmacies, qui répondent avec leur cotation.
          </Text>

          {lignes.map((ligne, index) => (
            <View key={ligne.key} style={styles.ligne}>
              <View style={styles.ligneHeader}>
                <Text style={styles.ligneTitre}>Médicament {index + 1}</Text>
                {lignes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => retirer(ligne.key)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer le médicament ${index + 1}`}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={22}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <AppTextField
                label="Nom du médicament"
                value={ligne.nom}
                onChangeText={(value) => patch(ligne.key, { nom: value })}
                placeholder="Ex. Doliprane 1000 mg"
                returnKeyType="next"
              />
              <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Quantité</Text>
                <TouchableOpacity
                  style={styles.stepper}
                  onPress={() =>
                    patch(ligne.key, {
                      quantite: Math.max(1, ligne.quantite - 1),
                    })
                  }
                  disabled={ligne.quantite <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuer la quantité"
                >
                  <MaterialIcons
                    name="remove"
                    size={20}
                    color={colors.surface}
                  />
                </TouchableOpacity>
                <Text style={styles.quantite}>{ligne.quantite}</Text>
                <TouchableOpacity
                  style={styles.stepper}
                  onPress={() =>
                    patch(ligne.key, {
                      quantite: Math.min(999, ligne.quantite + 1),
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Augmenter la quantité"
                >
                  <MaterialIcons name="add" size={20} color={colors.surface} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {lignes.length < LIGNES_MAX && (
            <TouchableOpacity
              style={styles.ajout}
              onPress={() =>
                setLignes((previous) => [...previous, nouvelleLigne()])
              }
              accessibilityRole="button"
              accessibilityLabel="Ajouter un médicament"
            >
              <MaterialIcons name="add" size={20} color={colors.primary} />
              <Text style={styles.ajoutTexte}>Ajouter un médicament</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.urgentRow}
            onPress={() => setUrgente((previous) => !previous)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: urgente }}
            accessibilityLabel="Requête urgente"
          >
            <MaterialIcons
              name={urgente ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={urgente ? colors.danger : colors.textMuted}
            />
            <Text style={styles.urgentText}>Requête urgente</Text>
          </TouchableOpacity>

          <AppTextField
            label="Précisions (optionnel)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Formes acceptées, délai…"
            multiline
            numberOfLines={2}
          />
          <AppTextField
            label="Mon contact (optionnel)"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
            placeholder={pharmacien?.whatsapp ?? "WhatsApp / téléphone"}
          />

          <AppButton
            title="Diffuser la requête"
            onPress={() => void handleSend()}
            loading={sending}
            fullWidth
            icon="campaign"
            style={styles.envoyer}
            accessibilityLabel="Diffuser la requête"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  explication: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  ligne: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md + 2,
    marginBottom: spacing.sm + 2,
  },
  ligneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  ligneTitre: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  stepperLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  stepper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quantite: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginHorizontal: spacing.lg,
    minWidth: 40,
    textAlign: "center",
  },
  ajout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  ajoutTexte: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  urgentText: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  envoyer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
