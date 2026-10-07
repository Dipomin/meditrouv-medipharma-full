import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Skeleton,
  colors,
  fontSize,
  radius,
  spacing,
  useToast,
} from "../components/ui";
import { ApiError, annuaireAPI, stockAPI } from "../lib/api";
import { logger } from "../lib/logger";
import { usePharmacienSession } from "../lib/usePharmacienSession";
import { offlineAwareMessage } from "../lib/offline";

type EditForm = {
  nomMedicament: string;
  quantite: string;
  prix: string;
  categorie: string;
  description: string;
};

const EMPTY_FORM: EditForm = {
  nomMedicament: "",
  quantite: "",
  prix: "",
  categorie: "",
  description: "",
};

export default function StockEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [errors, setErrors] = useState({ quantite: "", prix: "" });
  const communeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      if (!id) {
        return;
      }
      try {
        const med = await annuaireAPI.medicamentById(id);
        if (cancelled) {
          return;
        }
        communeRef.current = med.commune ?? undefined;
        setForm({
          nomMedicament: med.nomMedicament,
          quantite: String(med.quantite),
          prix: med.prix != null ? String(med.prix) : "",
          categorie: "",
          description: med.description ?? "",
        });
      } catch (error) {
        logger.error("Échec du chargement de la fiche.", error);
        if (!cancelled) {
          toast.error(offlineAwareMessage(error, "Fiche introuvable."));
          router.back();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router, toast]);

  const handleChange = (key: keyof EditForm, value: string): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (key === "quantite" || key === "prix") {
      setErrors((previous) => ({ ...previous, [key]: "" }));
    }
  };

  const adjust = (delta: number): void => {
    void Haptics.selectionAsync().catch(() => undefined);
    setForm((previous) => {
      const current = Number(previous.quantite);
      const next = (Number.isFinite(current) ? current : 0) + delta;
      return { ...previous, quantite: String(Math.max(0, next)) };
    });
  };

  const handleSave = useCallback(async (): Promise<void> => {
    if (!pharmacien || !id) {
      return;
    }
    const nextErrors = { quantite: "", prix: "" };
    const quantite = Number(form.quantite);
    if (!Number.isInteger(quantite) || quantite < 0) {
      nextErrors.quantite = "La quantité doit être un entier positif.";
    }
    const prix = form.prix.trim() === "" ? undefined : Number(form.prix);
    if (prix !== undefined && (!Number.isFinite(prix) || prix < 0)) {
      nextErrors.prix = "Le prix est invalide.";
    }
    setErrors(nextErrors);
    if (nextErrors.quantite || nextErrors.prix) {
      return;
    }
    try {
      setSaving(true);
      await stockAPI.update(pharmacien.id, id, {
        quantite,
        prix,
        description: form.description.trim() || undefined,
        categorie: form.categorie.trim() || undefined,
      });
      toast.success("Stock mis à jour.");
      router.back();
    } catch (error) {
      logger.error("Échec de la mise à jour du stock.", error);
      toast.error(
        error instanceof ApiError ? error.message : "Mise à jour impossible."
      );
    } finally {
      setSaving(false);
    }
  }, [pharmacien, id, form, toast, router]);

  const handleDelete = useCallback((): void => {
    if (!pharmacien?.pharmacieId || !id) {
      return;
    }
    // Suppression immédiate + « Annuler » (recréation à l'identique).
    const snapshot = { ...form };
    const pharmacieId = pharmacien.pharmacieId;
    const pharmacienId = pharmacien.id;
    const displayName = snapshot.nomMedicament || "Médicament";
    void (async (): Promise<void> => {
      try {
        await stockAPI.remove(pharmacienId, id);
        router.back();
        toast.success(`${displayName} retiré de votre stock.`, 6000, {
          label: "Annuler",
          onPress: () => {
            const quantite = Number(snapshot.quantite);
            const prix =
              snapshot.prix.trim() === "" ? undefined : Number(snapshot.prix);
            stockAPI
              .create(pharmacienId, pharmacieId, {
                nomMedicament: snapshot.nomMedicament,
                quantite:
                  Number.isInteger(quantite) && quantite >= 0 ? quantite : 0,
                prix:
                  prix !== undefined && Number.isFinite(prix) && prix >= 0
                    ? prix
                    : undefined,
                categorie: snapshot.categorie.trim() || undefined,
                description: snapshot.description.trim() || undefined,
                commune: communeRef.current,
              })
              .then(() => toast.success(`${displayName} restauré.`))
              .catch((error: unknown) => {
                logger.error("Échec de la restauration.", error);
                toast.error(
                  offlineAwareMessage(error, "Restauration impossible.")
                );
              });
          },
        });
      } catch (error) {
        logger.error("Échec de la suppression.", error);
        toast.error(offlineAwareMessage(error, "Suppression impossible."));
      }
    })();
  }, [pharmacien, id, form, toast, router]);

  return (
    <Screen>
      <AppHeader title="Modifier le stock" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <ScrollView contentContainerStyle={styles.loadingContent}>
            <Skeleton width="50%" height={22} />
            <View style={styles.gap} />
            <Skeleton width="100%" height={50} />
            <View style={styles.gap} />
            <Skeleton width="100%" height={50} />
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <Text style={styles.name}>{form.nomMedicament}</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.stepper}
                  onPress={() => adjust(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuer la quantité"
                >
                  <MaterialIcons
                    name="remove"
                    size={24}
                    color={colors.surface}
                  />
                </TouchableOpacity>
                <AppTextField
                  label="Quantité en stock *"
                  value={form.quantite}
                  onChangeText={(v) => handleChange("quantite", v)}
                  error={errors.quantite || undefined}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  containerStyle={styles.quantityField}
                  style={styles.quantityInput}
                />
                <TouchableOpacity
                  style={styles.stepper}
                  onPress={() => adjust(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Augmenter la quantité"
                >
                  <MaterialIcons name="add" size={24} color={colors.surface} />
                </TouchableOpacity>
              </View>
              <View style={styles.quickRow}>
                {[5, 10, 50].map((step) => (
                  <TouchableOpacity
                    key={step}
                    style={styles.quickChip}
                    onPress={() => adjust(step)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ajouter ${step}`}
                  >
                    <Text style={styles.quickText}>+{step}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <AppTextField
                label="Prix (F CFA)"
                value={form.prix}
                onChangeText={(v) => handleChange("prix", v)}
                error={errors.prix || undefined}
                keyboardType="number-pad"
                returnKeyType="next"
              />
              <AppTextField
                label="Catégorie"
                value={form.categorie}
                onChangeText={(v) => handleChange("categorie", v)}
                returnKeyType="next"
              />
              <AppTextField
                label="Description"
                value={form.description}
                onChangeText={(v) => handleChange("description", v)}
                multiline
                numberOfLines={3}
                style={styles.multiline}
              />
              <AppButton
                title="Enregistrer"
                onPress={() => void handleSave()}
                loading={saving}
                fullWidth
                accessibilityLabel="Enregistrer"
              />
              <AppButton
                title="Retirer de mon stock"
                onPress={handleDelete}
                variant="danger"
                fullWidth
                style={styles.deleteButton}
                accessibilityLabel="Retirer du stock"
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContent: {
    padding: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  form: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: radius.xl,
    padding: spacing.xl - 2,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  stepper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    // Aligne les boutons sur le champ (compense le label : 20 + 6).
    marginTop: 26,
  },
  quantityField: {
    flex: 1,
    marginHorizontal: spacing.sm,
    marginBottom: 0,
  },
  quantityInput: {
    textAlign: "center",
    fontSize: fontSize.xxl,
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  quickChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg + 1,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  quickText: {
    color: colors.primary,
    fontWeight: "700",
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});
