import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { usePharmacienAuth } from "./context/PharmacienAuthContext";
import { ApiError, pharmacienAPI } from "./lib/api";
import { logger } from "./lib/logger";
import { parsePhone } from "./lib/validation";

export default function AuthScreen() {
  const router = useRouter();
  const { login } = usePharmacienAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numeroOrdre: "",
    password: "",
    whatsapp: "",
  });
  const [errors, setErrors] = useState({
    numeroOrdre: "",
    password: "",
    whatsapp: "",
  });
  const [usePassword, setUsePassword] = useState(true);
  const passwordRef = useRef<TextInput>(null);
  const whatsappRef = useRef<TextInput>(null);

  const handleChange = (
    key: "numeroOrdre" | "password" | "whatsapp",
    value: string
  ): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  };

  const handleLogin = async (): Promise<void> => {
    const nextErrors = { numeroOrdre: "", password: "", whatsapp: "" };
    if (!form.numeroOrdre.trim()) {
      nextErrors.numeroOrdre = "Veuillez saisir votre numéro d'ordre.";
    }
    if (usePassword && !form.password) {
      nextErrors.password = "Veuillez saisir votre mot de passe.";
    }
    if (!usePassword && !parsePhone(form.whatsapp)) {
      nextErrors.whatsapp = "Numéro WhatsApp invalide (8 à 15 chiffres).";
    }
    setErrors(nextErrors);
    if (nextErrors.numeroOrdre || nextErrors.password || nextErrors.whatsapp) {
      return;
    }
    try {
      setLoading(true);
      const pharmacien = await pharmacienAPI.login({
        numeroOrdre: form.numeroOrdre.trim(),
        ...(usePassword
          ? { password: form.password }
          : { whatsapp: form.whatsapp.trim() }),
      });
      await login(pharmacien);
      toast.success(`Bienvenue, ${pharmacien.nomPharmacienTitulaire}.`);
      if (!pharmacien.abonne) {
        router.replace("/abonnement");
      } else if (!pharmacien.pharmacieId) {
        toast.info(
          "Compte en attente de rattachement à une pharmacie.",
          5000
        );
        router.replace("/profil");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      logger.error("Échec de la connexion.", error);
      if (error instanceof ApiError && error.status === 401) {
        Alert.alert(
          "Compte non trouvé",
          "Aucun compte ne correspond à ces identifiants. Voulez-vous créer un compte ?",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Créer un compte",
              onPress: () => router.push("/inscription"),
            },
          ]
        );
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Impossible de se connecter. Vérifiez votre connexion."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Medipharma" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <MaterialIcons
              name="local-pharmacy"
              size={60}
              color={colors.primary}
            />
            <Text style={styles.title}>Connexion Pharmacien</Text>
            <Text style={styles.subtitle}>
              Accédez aux alertes de recherche et à votre stock
            </Text>

            <AppTextField
              label="Numéro d'ordre"
              placeholder="ex. E2E-001"
              value={form.numeroOrdre}
              onChangeText={(v) => handleChange("numeroOrdre", v)}
              error={errors.numeroOrdre || undefined}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() =>
                (usePassword ? passwordRef : whatsappRef).current?.focus()
              }
              leftIcon="badge"
            />

            {usePassword ? (
              <AppTextField
                label="Mot de passe"
                placeholder="Votre mot de passe"
                value={form.password}
                onChangeText={(v) => handleChange("password", v)}
                error={errors.password || undefined}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                leftIcon="lock"
                inputRef={passwordRef}
              />
            ) : (
              <AppTextField
                label="Numéro WhatsApp"
                placeholder="ex. +2250787225204"
                value={form.whatsapp}
                onChangeText={(v) => handleChange("whatsapp", v)}
                error={errors.whatsapp || undefined}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                leftIcon="chat"
                inputRef={whatsappRef}
              />
            )}

            <TouchableOpacity
              onPress={() => setUsePassword((previous) => !previous)}
              accessibilityRole="button"
              accessibilityLabel="Changer de mode de connexion"
            >
              <Text style={styles.switchLink}>
                {usePassword
                  ? "Pas de mot de passe ? Utiliser WhatsApp"
                  : "Utiliser mon mot de passe"}
              </Text>
            </TouchableOpacity>

            <AppButton
              title="Se connecter"
              onPress={() => void handleLogin()}
              loading={loading}
              fullWidth
              accessibilityLabel="Se connecter"
            />

            <View style={styles.createAccountContainer}>
              <Text style={styles.createAccountText}>
                Vous n&apos;avez pas de compte ?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/inscription")}
                accessibilityRole="button"
                accessibilityLabel="Créer un compte pharmacien"
              >
                <Text style={styles.createAccountLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
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
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  content: {
    padding: spacing.xl,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "700",
    marginTop: spacing.sm + 2,
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xxl,
    marginTop: 6,
  },
  switchLink: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.sm + 2,
  },
  createAccountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginRight: 5,
  },
  createAccountLink: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "700",
  },
});
