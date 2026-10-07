import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePharmacienAuth } from "./context/PharmacienAuthContext";
import { ApiError, annuaireAPI, pharmacienAPI, type Pharmacie } from "./lib/api";
import { logger } from "./lib/logger";
import { isValidOptionalEmail, parsePhone } from "./lib/validation";

export default function InscriptionScreen() {
  const router = useRouter();
  const { login } = usePharmacienAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numeroOrdre: "",
    nomPharmacienTitulaire: "",
    nomPharmacie: "",
    whatsapp: "",
    email: "",
    telephoneFixe: "",
    ville: "",
    commune: "",
    password: "",
  });
  const [pharmacies, setPharmacies] = useState<Pharmacie[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedPharmacie, setSelectedPharmacie] = useState<Pharmacie | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const list = await annuaireAPI.pharmacies(
          pickerQuery.trim() || undefined
        );
        if (!cancelled) {
          setPharmacies(list);
        }
      } catch (error) {
        logger.warn("Liste des pharmacies inaccessible.", error);
      }
    };
    if (pickerVisible) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [pickerVisible, pickerQuery]);

  const handleChange = (key: string, value: string): void =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async (): Promise<void> => {
    if (!form.numeroOrdre.trim() || !form.nomPharmacienTitulaire.trim()) {
      Alert.alert(
        "Erreur",
        "Le numéro d'ordre et le nom du titulaire sont obligatoires."
      );
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
    if (form.password && form.password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }
    try {
      setLoading(true);
      const pharmacien = await pharmacienAPI.register({
        numeroOrdre: form.numeroOrdre.trim(),
        nomPharmacienTitulaire: form.nomPharmacienTitulaire.trim(),
        nomPharmacie:
          selectedPharmacie?.nomPharmacie || form.nomPharmacie.trim() || undefined,
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim() || undefined,
        telephoneFixe: form.telephoneFixe.trim() || undefined,
        ville: form.ville.trim() || undefined,
        commune: form.commune.trim() || undefined,
        password: form.password || undefined,
        pharmacieId: selectedPharmacie?.id,
      });
      await login(pharmacien);
      Alert.alert(
        "Compte créé",
        "Bienvenue sur Medipharma ! Choisissez votre abonnement pour activer les alertes.",
        [{ text: "Continuer", onPress: () => router.replace("/abonnement") }]
      );
    } catch (error) {
      logger.error("Échec de l'inscription.", error);
      Alert.alert(
        "Erreur",
        error instanceof ApiError
          ? error.message
          : "Impossible de créer le compte. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/images/bg_search.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un compte</Text>
        </View>

        <FlatList
          style={styles.form}
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View>
              <TextInput
                style={styles.input}
                placeholder="Numéro d'ordre *"
                value={form.numeroOrdre}
                onChangeText={(v) => handleChange("numeroOrdre", v)}
                accessibilityLabel="Numéro d'ordre"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Nom du pharmacien titulaire *"
                value={form.nomPharmacienTitulaire}
                onChangeText={(v) => handleChange("nomPharmacienTitulaire", v)}
                accessibilityLabel="Nom du pharmacien titulaire"
              />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setPickerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Choisir ma pharmacie"
              >
                <Text
                  style={
                    selectedPharmacie
                      ? styles.pickerText
                      : styles.pickerPlaceholder
                  }
                >
                  {selectedPharmacie
                    ? selectedPharmacie.nomPharmacie
                    : "Choisir ma pharmacie (optionnel)"}
                </Text>
              </TouchableOpacity>
              {!selectedPharmacie && (
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la pharmacie (si absente de la liste)"
                  value={form.nomPharmacie}
                  onChangeText={(v) => handleChange("nomPharmacie", v)}
                  accessibilityLabel="Nom de la pharmacie"
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Numéro WhatsApp *"
                value={form.whatsapp}
                onChangeText={(v) => handleChange("whatsapp", v)}
                keyboardType="phone-pad"
                accessibilityLabel="Numéro WhatsApp"
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe (min. 6 caractères)"
                value={form.password}
                onChangeText={(v) => handleChange("password", v)}
                secureTextEntry
                accessibilityLabel="Mot de passe"
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail (optionnel)"
                value={form.email}
                onChangeText={(v) => handleChange("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="E-mail"
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone fixe (optionnel)"
                value={form.telephoneFixe}
                onChangeText={(v) => handleChange("telephoneFixe", v)}
                keyboardType="phone-pad"
                accessibilityLabel="Téléphone fixe"
              />
              <TextInput
                style={styles.input}
                placeholder="Ville (optionnel)"
                value={form.ville}
                onChangeText={(v) => handleChange("ville", v)}
                accessibilityLabel="Ville"
              />
              <TextInput
                style={styles.input}
                placeholder="Commune (optionnel)"
                value={form.commune}
                onChangeText={(v) => handleChange("commune", v)}
                accessibilityLabel="Commune"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={() => void handleSubmit()}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Créer mon compte"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Créer mon compte</Text>
                )}
              </TouchableOpacity>
            </View>
          }
        />

        <Modal visible={pickerVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir ma pharmacie</Text>
              <TextInput
                style={styles.input}
                placeholder="Rechercher…"
                value={pickerQuery}
                onChangeText={setPickerQuery}
                accessibilityLabel="Rechercher une pharmacie"
              />
              <FlatList
                data={pharmacies}
                keyExtractor={(item) => item.id}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedPharmacie(item);
                      setPickerVisible(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.nomPharmacie}
                  >
                    <MaterialIcons
                      name="local-pharmacy"
                      size={20}
                      color="#2E7D32"
                    />
                    <View style={styles.pickerItemText}>
                      <Text style={styles.pickerItemName}>
                        {item.nomPharmacie}
                      </Text>
                      {item.commune ? (
                        <Text style={styles.pickerItemCommune}>
                          {item.commune}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Aucune pharmacie trouvée.</Text>
                }
              />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setPickerVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b1d6c8",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
  },
  header: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  form: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 20,
    borderRadius: 15,
    padding: 20,
  },
  input: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "white",
    fontSize: 16,
    justifyContent: "center",
  },
  pickerText: {
    fontSize: 16,
    color: "#333",
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 12,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pickerItemText: {
    marginLeft: 10,
  },
  pickerItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  pickerItemCommune: {
    fontSize: 13,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    padding: 20,
  },
  modalClose: {
    marginTop: 12,
    alignItems: "center",
    padding: 10,
  },
  modalCloseText: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
});
