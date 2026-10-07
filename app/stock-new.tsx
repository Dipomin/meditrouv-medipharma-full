import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  AppButton,
  AppHeader,
  AppTextField,
  Screen,
  radius,
  spacing,
  useToast,
} from "./components/ui";
import { ApiError, stockAPI } from "./lib/api";
import { logger } from "./lib/logger";
import { usePharmacienSession } from "./lib/usePharmacienSession";

type StockForm = {
  nomMedicament: string;
  quantite: string;
  prix: string;
  categorie: string;
  description: string;
};

const EMPTY_ERRORS: Record<keyof StockForm, string> = {
  nomMedicament: "",
  quantite: "",
  prix: "",
  categorie: "",
  description: "",
};

export default function StockNewScreen() {
  const router = useRouter();
  const { pharmacien } = usePharmacienSession();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StockForm>({
    nomMedicament: "",
    quantite: "",
    prix: "",
    categorie: "",
    description: "",
  });
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const quantiteRef = useRef<TextInput>(null);
  const prixRef = useRef<TextInput>(null);
  const categorieRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const handleChange = (key: keyof StockForm, value: string): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const handleSave = async (): Promise<void> => {
    if (!pharmacien?.pharmacieId) {
      toast.error("Compte non rattaché à une pharmacie.");
      return;
    }
    const nextErrors = { ...EMPTY_ERRORS };
    if (!form.nomMedicament.trim()) {
      nextErrors.nomMedicament = "Le nom du médicament est obligatoire.";
    }
    const quantite = Number(form.quantite);
    if (!Number.isInteger(quantite) || quantite < 0) {
      nextErrors.quantite = "La quantité doit être un entier positif.";
    }
    const prix = form.prix.trim() === "" ? undefined : Number(form.prix);
    if (prix !== undefined && (!Number.isFinite(prix) || prix < 0)) {
      nextErrors.prix = "Le prix est invalide.";
    }
    setErrors(nextErrors);
    if (nextErrors.nomMedicament || nextErrors.quantite || nextErrors.prix) {
      return;
    }
    try {
      setSaving(true);
      await stockAPI.create(pharmacien.id, pharmacien.pharmacieId, {
        nomMedicament: form.nomMedicament.trim(),
        quantite,
        prix,
        categorie: form.categorie.trim() || undefined,
        description: form.description.trim() || undefined,
        commune: pharmacien.pharmacie?.commune ?? undefined,
      });
      toast.success("Médicament ajouté à votre stock.");
      router.back();
    } catch (error) {
      logger.error("Échec de l'ajout au stock.", error);
      toast.error(
        error instanceof ApiError ? error.message : "Ajout impossible."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Ajouter au stock" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <AppTextField
              label="Nom du médicament *"
              value={form.nomMedicament}
              onChangeText={(v) => handleChange("nomMedicament", v)}
              error={errors.nomMedicament || undefined}
              placeholder="ex. Doliprane 500mg"
              returnKeyType="next"
              onSubmitEditing={() => quantiteRef.current?.focus()}
            />
            <AppTextField
              label="Quantité *"
              value={form.quantite}
              onChangeText={(v) => handleChange("quantite", v)}
              error={errors.quantite || undefined}
              placeholder="ex. 50"
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => prixRef.current?.focus()}
              inputRef={quantiteRef}
            />
            <AppTextField
              label="Prix (F CFA)"
              value={form.prix}
              onChangeText={(v) => handleChange("prix", v)}
              error={errors.prix || undefined}
              placeholder="ex. 1500"
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => categorieRef.current?.focus()}
              inputRef={prixRef}
            />
            <AppTextField
              label="Catégorie"
              value={form.categorie}
              onChangeText={(v) => handleChange("categorie", v)}
              placeholder="ex. Antalgique"
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              inputRef={categorieRef}
            />
            <AppTextField
              label="Description"
              value={form.description}
              onChangeText={(v) => handleChange("description", v)}
              placeholder="Présentation, dosage…"
              multiline
              numberOfLines={3}
              style={styles.multiline}
              inputRef={descriptionRef}
            />
            <AppButton
              title="Ajouter au stock"
              onPress={() => void handleSave()}
              loading={saving}
              fullWidth
              accessibilityLabel="Ajouter au stock"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
});
