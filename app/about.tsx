import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const router = useRouter();
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
          <Text style={styles.headerTitle}>À propos</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Medipharma</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.paragraph}>
              Medipharma est l&apos;application des pharmaciens partenaires
              du réseau Meditrouv. Elle vous alerte en temps réel quand un
              patient recherche un médicament disponible dans votre
              pharmacie, directement dans l&apos;application et sur
              WhatsApp.
            </Text>
            <View style={styles.feature}>
              <MaterialIcons
                name="notifications-active"
                size={22}
                color="#2E7D32"
              />
              <Text style={styles.featureText}>
                Alertes instantanées des recherches patients
              </Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="inventory" size={22} color="#2E7D32" />
              <Text style={styles.featureText}>
                Mise à jour continue de votre stock
              </Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons
                name="shopping-cart"
                size={22}
                color="#2E7D32"
              />
              <Text style={styles.featureText}>
                Commandes inter-pharmacies en cas de rupture
              </Text>
            </View>
            <Text style={styles.paragraph}>
              Un stock à jour garantit que les patients trouvent vos
              médicaments dans Meditrouv et se rendent dans votre
              pharmacie.
            </Text>
            <Image
              source={require("../assets/images/ajl-groupe.png")}
              style={styles.logoAjl}
              resizeMode="contain"
            />
          </View>
          <View style={styles.bottomSpacer} />
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 8,
  },
  version: {
    fontSize: 13,
    color: "#999",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 14,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  logoAjl: {
    width: 120,
    height: 80,
    borderRadius: 12,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 90,
  },
});
