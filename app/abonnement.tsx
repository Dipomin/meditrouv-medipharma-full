import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PHARMACIEN_SUBSCRIPTION } from "./lib/payment";
import { usePharmacienSession } from "./lib/usePharmacienSession";

type ServiceInfo = {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  description: string;
};

const SERVICES: ServiceInfo[] = [
  {
    icon: "notifications-active",
    title: "Alertes de recherche",
    description:
      "Notifié dès qu'un patient recherche un de vos médicaments, in-app et sur WhatsApp",
  },
  {
    icon: "inventory",
    title: "Gestion du stock",
    description:
      "Mettez votre stock à jour en continu et apparaissez dans les recherches",
  },
  {
    icon: "shopping-cart",
    title: "Commandes inter-pharmacies",
    description: "Commandez auprès des pharmacies partenaires en rupture évitée",
  },
  {
    icon: "analytics",
    title: "Tableau de bord",
    description: "Suivez recherches, ruptures et commandes en temps réel",
  },
  {
    icon: "support",
    title: "Support prioritaire",
    description: "Bénéficiez d'un support dédié aux professionnels",
  },
];

export default function AbonnementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { pharmacien, isReady } = usePharmacienSession();
  const { montant } = PHARMACIEN_SUBSCRIPTION;

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  useEffect(() => {
    if (isReady && pharmacien?.abonne) {
      router.replace("/dashboard");
    }
  }, [isReady, pharmacien, router]);

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
          <Text style={styles.headerTitle}>Abonnement Medipharma</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <MaterialIcons name="local-pharmacy" size={80} color="#2E7D32" />
            <Text style={styles.title}>Abonnement Medipharma</Text>
            <Text style={styles.subtitle}>
              Activez les alertes de recherche et tous les services pro
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>
                {Number(montant).toLocaleString("fr-FR")} F
              </Text>
              <Text style={styles.priceUnit}>/ an</Text>
            </View>

            <View style={styles.servicesContainer}>
              <Text style={styles.servicesTitle}>Services inclus :</Text>
              {SERVICES.map((service) => (
                <View key={service.title} style={styles.serviceItem}>
                  <MaterialIcons
                    name={service.icon}
                    size={24}
                    color="#2E7D32"
                    style={styles.serviceIcon}
                  />
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>
                      {service.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => {
                setLoading(true);
                router.push("/paiement-mobile");
                setLoading(false);
              }}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="S'abonner maintenant"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons
                    name="payment"
                    size={24}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.subscribeButtonText}>
                    S&apos;abonner maintenant
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={() => router.replace("/dashboard")}
              accessibilityRole="button"
              accessibilityLabel="Plus tard"
            >
              <Text style={styles.laterButtonText}>Plus tard</Text>
            </TouchableOpacity>
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
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 20,
    borderRadius: 15,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: 10,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ff6a00",
  },
  priceUnit: {
    fontSize: 18,
    color: "#666",
    marginLeft: 4,
  },
  servicesContainer: {
    width: "100%",
    marginTop: 10,
  },
  servicesTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  serviceItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  serviceIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  serviceDescription: {
    fontSize: 13,
    color: "#666",
  },
  subscribeButton: {
    flexDirection: "row",
    width: "100%",
    height: 54,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  subscribeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },
  laterButton: {
    marginTop: 12,
    padding: 10,
  },
  laterButtonText: {
    color: "#666",
    fontSize: 15,
  },
});
