import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { colors } from "./components/ui";
import { usePharmacienAuth } from "./context/PharmacienAuthContext";
import { logger } from "./lib/logger";
import { offlineAwareMessage } from "./lib/offline";
import {
  buildSubscriptionPeriod,
  PAYMENT_OPERATORS,
  PHARMACIEN_SUBSCRIPTION,
} from "./lib/payment";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { parsePhone } from "./lib/validation";

export default function PaiementMobileScreen() {
  const router = useRouter();
  const { updatePharmacien } = usePharmacienAuth();
  const [loading, setLoading] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [validationCode, setValidationCode] = useState("");

  // Montant et forfait de référence (jamais lus depuis la route).
  const { montant, forfait, durationDays } = PHARMACIEN_SUBSCRIPTION;
  const { pharmacien, isReady } = usePharmacienSession();
  const phoneNumber = phoneOverride ?? pharmacien?.whatsapp ?? "";

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  const handlePayment = async (): Promise<void> => {
    if (!selectedOperator) {
      Alert.alert("Erreur", "Veuillez sélectionner un opérateur.");
      return;
    }
    const validPhone = parsePhone(phoneNumber);
    if (!validPhone) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone valide.");
      return;
    }
    if (!validationCode.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le code de validation.");
      return;
    }
    if (!pharmacien) {
      Alert.alert("Erreur", "Session pharmacien introuvable.");
      return;
    }
    try {
      setLoading(true);
      // NOTE : paiement simulé (aucun opérateur intégré). Intégrer le SDK
      // marchand avant usage réel ; la validation serveur suivra.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const { dateSouscription, dateExpiration } =
        buildSubscriptionPeriod(durationDays);
      await updatePharmacien({
        abonne: true,
        forfait,
        dateSouscription,
        dateExpiration,
        moyenPaiement: selectedOperator,
      });
      Alert.alert(
        "Paiement réussi",
        "Votre abonnement Medipharma a été activé avec succès !",
        [{ text: "OK", onPress: () => router.replace("/dashboard") }]
      );
    } catch (error) {
      logger.error("Échec du paiement pharmacien.", error);
      Alert.alert(
        "Erreur",
        offlineAwareMessage(
          error,
          "Impossible de traiter le paiement. Veuillez réessayer."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const getPaymentSyntax = (): string => {
    switch (selectedOperator) {
      case "orange":
        return `#144*1*1*${montant}*${phoneNumber}#`;
      case "mtn":
        return `*126*1*1*${montant}*${phoneNumber}#`;
      case "moov":
        return `*555*1*1*${montant}*${phoneNumber}#`;
      case "wave":
        return "Scannez le QR code avec votre application Wave";
      default:
        return "";
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
          <Text style={styles.headerTitle}>Paiement Mobile</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.demoNotice}>
              Mode démonstration : le paiement est simulé, aucun débit réel
              n&apos;est effectué.
            </Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                Résumé de l&apos;abonnement
              </Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Service :</Text>
                <Text style={styles.summaryValue}>{forfait}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Montant :</Text>
                <Text style={styles.summaryValue}>{montant} F CFA</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pharmacie :</Text>
                <Text style={styles.summaryValue}>
                  {pharmacien?.pharmacie?.nomPharmacie ??
                    pharmacien?.nomPharmacie ??
                    "—"}
                </Text>
              </View>
            </View>

            <View style={styles.operatorsContainer}>
              <Text style={styles.operatorsTitle}>
                Choisissez votre opérateur :
              </Text>
              {PAYMENT_OPERATORS.map((operator) => (
                <TouchableOpacity
                  key={operator.id}
                  style={[
                    styles.operatorButton,
                    selectedOperator === operator.id &&
                      styles.operatorButtonSelected,
                    { borderColor: operator.color },
                  ]}
                  onPress={() => setSelectedOperator(operator.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Payer avec ${operator.name}`}
                >
                  <View style={styles.operatorContent}>
                    <View
                      style={[
                        styles.operatorIcon,
                        { backgroundColor: operator.color },
                      ]}
                    >
                      <MaterialIcons
                        name="phone-android"
                        size={24}
                        color="white"
                      />
                    </View>
                    <Text style={styles.operatorName}>{operator.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {selectedOperator !== "" && (
              <View style={styles.paymentForm}>
                <Text style={styles.inputLabel}>Numéro de téléphone :</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  placeholder="Ex: 77123456"
                  value={phoneNumber}
                  onChangeText={setPhoneOverride}
                  keyboardType="phone-pad"
                  accessibilityLabel="Numéro de téléphone"
                  autoComplete="tel"
                />
                <View style={styles.syntaxContainer}>
                  <Text style={styles.syntaxTitle}>Syntaxe de paiement :</Text>
                  <Text style={styles.syntaxText}>{getPaymentSyntax()}</Text>
                </View>
                <Text style={styles.inputLabel}>Code de validation :</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={colors.textFaint}
                  placeholder="Entrez le code reçu par SMS"
                  value={validationCode}
                  onChangeText={setValidationCode}
                  accessibilityLabel="Code de validation"
                />
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => void handlePayment()}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Payer maintenant"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.payButtonText}>
                      Payer {montant} F CFA
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 20,
    borderRadius: 15,
    padding: 20,
  },
  demoNotice: {
    backgroundColor: "#FFF3E0",
    color: "#E65100",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 14,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  operatorsContainer: {
    marginBottom: 16,
  },
  operatorsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  operatorButton: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "white",
  },
  operatorButtonSelected: {
    backgroundColor: "rgba(46, 125, 50, 0.08)",
  },
  operatorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  operatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  paymentForm: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "white",
    // Couleur explicite : sans elle, Android applique la couleur du thème
    // système (claire en mode sombre), illisible sur ce fond blanc.
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  syntaxContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  syntaxTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  syntaxText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 4,
  },
  payButton: {
    height: 54,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  payButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },
});
