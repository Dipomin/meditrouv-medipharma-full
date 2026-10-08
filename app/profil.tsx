import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { unregisterPushOnLogout } from "./components/PushBootstrap";
import { colors } from "./components/ui";
import { usePharmacienAuth } from "./context/PharmacienAuthContext";
import { ApiError, pharmacienAPI } from "./lib/api";
import { logger } from "./lib/logger";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { isValidOptionalEmail, parsePhone } from "./lib/validation";

export default function ProfilScreen() {
  const router = useRouter();
  const { logout, updatePharmacien } = usePharmacienAuth();
  const { pharmacien, isReady, refresh } = usePharmacienSession();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nomPharmacienTitulaire: "",
    whatsapp: "",
    email: "",
    telephoneFixe: "",
    ville: "",
    commune: "",
  });

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  // Le formulaire est alimenté à l'ouverture du mode édition (gestionnaire
  // d'événement), jamais par synchronisation dans un effet.
  const startEditing = useCallback((): void => {
    if (!pharmacien) {
      return;
    }
    setForm({
      nomPharmacienTitulaire: pharmacien.nomPharmacienTitulaire,
      whatsapp: pharmacien.whatsapp,
      email: pharmacien.email ?? "",
      telephoneFixe: pharmacien.telephoneFixe ?? "",
      ville: pharmacien.ville ?? "",
      commune: pharmacien.commune ?? "",
    });
    setEditing(true);
  }, [pharmacien]);

  const handleSave = async (): Promise<void> => {
    if (!pharmacien) {
      return;
    }
    if (!parsePhone(form.whatsapp.trim())) {
      Alert.alert("Erreur", "Numéro WhatsApp invalide.");
      return;
    }
    if (!isValidOptionalEmail(form.email)) {
      Alert.alert("Erreur", "Adresse e-mail invalide.");
      return;
    }
    try {
      setSaving(true);
      const updated = await pharmacienAPI.updateMe(pharmacien.id, {
        nomPharmacienTitulaire: form.nomPharmacienTitulaire.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim() || null,
        telephoneFixe: form.telephoneFixe.trim() || null,
        ville: form.ville.trim() || null,
        commune: form.commune.trim() || null,
      });
      await updatePharmacien(updated);
      setEditing(false);
      Alert.alert("Profil", "Profil mis à jour.");
    } catch (error) {
      logger.error("Échec de la mise à jour du profil.", error);
      Alert.alert(
        "Erreur",
        error instanceof ApiError ? error.message : "Mise à jour impossible."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = (): void => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: () => {
          const pharmacienId = pharmacien?.id;
          (pharmacienId
            ? unregisterPushOnLogout(pharmacienId)
            : Promise.resolve()
          )
            .catch(() => undefined)
            .finally(() => {
              logout()
                .then(() => router.replace("/"))
                .catch((error: unknown) => {
                  logger.error("Échec de la déconnexion.", error);
                });
            });
        },
      },
    ]);
  };

  if (!isReady || !pharmacien) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/images/bg_search.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon compte</Text>
          <TouchableOpacity
            onPress={() => void refresh()}
            accessibilityRole="button"
            accessibilityLabel="Rafraîchir"
          >
            <MaterialIcons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <MaterialIcons
                name="account-circle"
                size={64}
                color="#2E7D32"
              />
              <View style={styles.avatarText}>
                <Text style={styles.name}>
                  {pharmacien.nomPharmacienTitulaire}
                </Text>
                <Text style={styles.ordre}>
                  Ordre n° {pharmacien.numeroOrdre}
                </Text>
              </View>
            </View>

            <View style={styles.badges}>
              <View
                style={[
                  styles.badge,
                  pharmacien.verified
                    ? styles.badgeOk
                    : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>
                  {pharmacien.verified ? "Vérifié" : "En attente de vérification"}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  pharmacien.abonne ? styles.badgeOk : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>
                  {pharmacien.abonne ? "Abonné" : "Non abonné"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Ma pharmacie</Text>
            <Text style={styles.pharmacieName}>
              {pharmacien.pharmacie?.nomPharmacie ??
                pharmacien.nomPharmacie ??
                "Non rattachée"}
            </Text>
            {pharmacien.pharmacie?.commune ? (
              <Text style={styles.pharmacieMeta}>
                {pharmacien.pharmacie.commune}
              </Text>
            ) : null}

            {!pharmacien.abonne && (
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => router.push("/abonnement")}
                accessibilityRole="button"
                accessibilityLabel="Voir l'abonnement"
              >
                <Text style={styles.subscribeText}>
                  Activer mon abonnement
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Mes informations</Text>
            {editing ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  value={form.nomPharmacienTitulaire}
                  onChangeText={(v) =>
                    setForm((previous) => ({
                      ...previous,
                      nomPharmacienTitulaire: v,
                    }))
                  }
                  placeholder="Nom du titulaire"
                  accessibilityLabel="Nom du titulaire"
                />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  value={form.whatsapp}
                  onChangeText={(v) =>
                    setForm((previous) => ({ ...previous, whatsapp: v }))
                  }
                  placeholder="WhatsApp"
                  keyboardType="phone-pad"
                  accessibilityLabel="WhatsApp"
                />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  value={form.email}
                  onChangeText={(v) =>
                    setForm((previous) => ({ ...previous, email: v }))
                  }
                  placeholder="E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="E-mail"
                />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  value={form.telephoneFixe}
                  onChangeText={(v) =>
                    setForm((previous) => ({
                      ...previous,
                      telephoneFixe: v,
                    }))
                  }
                  placeholder="Téléphone fixe"
                  keyboardType="phone-pad"
                  accessibilityLabel="Téléphone fixe"
                />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  value={form.ville}
                  onChangeText={(v) =>
                    setForm((previous) => ({ ...previous, ville: v }))
                  }
                  placeholder="Ville"
                  accessibilityLabel="Ville"
                />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  value={form.commune}
                  onChangeText={(v) =>
                    setForm((previous) => ({ ...previous, commune: v }))
                  }
                  placeholder="Commune"
                  accessibilityLabel="Commune"
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => void handleSave()}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Enregistrer"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Annuler"
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InfoRow label="WhatsApp" value={pharmacien.whatsapp} />
                <InfoRow label="E-mail" value={pharmacien.email ?? "—"} />
                <InfoRow
                  label="Fixe"
                  value={pharmacien.telephoneFixe ?? "—"}
                />
                <InfoRow label="Ville" value={pharmacien.ville ?? "—"} />
                <InfoRow label="Commune" value={pharmacien.commune ?? "—"} />
                {pharmacien.dateExpiration && (
                  <InfoRow
                    label="Abonnement jusqu'au"
                    value={new Date(
                      pharmacien.dateExpiration
                    ).toLocaleDateString("fr-FR")}
                  />
                )}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={startEditing}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier mes informations"
                >
                  <Text style={styles.editText}>Modifier</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.aboutLink}
              onPress={() => router.push("/about")}
              accessibilityRole="button"
              accessibilityLabel="À propos"
            >
              <Text style={styles.aboutText}>À propos de Medipharma</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
            >
              <MaterialIcons name="logout" size={20} color="#D32F2F" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={profilStyles.row}>
    <Text style={profilStyles.label}>{label}</Text>
    <Text style={profilStyles.value}>{value}</Text>
  </View>
);

const profilStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b1d6c8",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 15,
    padding: 18,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333",
  },
  ordre: {
    fontSize: 14,
    color: "#666",
  },
  badges: {
    flexDirection: "row",
    marginTop: 12,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  badgeOk: {
    backgroundColor: "rgba(46, 125, 50, 0.12)",
  },
  badgePending: {
    backgroundColor: "rgba(239, 108, 0, 0.12)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 18,
    marginBottom: 6,
  },
  pharmacieName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  pharmacieMeta: {
    fontSize: 14,
    color: "#666",
  },
  subscribeButton: {
    backgroundColor: "#ff6a00",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  subscribeText: {
    color: "white",
    fontWeight: "bold",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "white",
    // Couleur explicite : sans elle, Android applique la couleur du thème
    // système (claire en mode sombre), illisible sur ce fond blanc.
    color: colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 6,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#666",
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  editText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  aboutLink: {
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  aboutText: {
    color: "#1565C0",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#D32F2F",
    fontWeight: "bold",
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 90,
  },
});
