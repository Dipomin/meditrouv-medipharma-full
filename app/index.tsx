import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { usePharmacienAuth } from "./context/PharmacienAuthContext";
import {
  isTablet,
  responsiveSpacing,
  responsiveValue,
  screenWidth,
} from "./utils/responsive";

export default function Index() {
  const router = useRouter();
  const { pharmacien, isLoading } = usePharmacienAuth();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(50));

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => {
      animation.stop();
    };
  }, [fadeAnim, slideAnim]);

  // Session existante : entrée directe dans l'espace pro.
  useEffect(() => {
    if (!isLoading && pharmacien) {
      router.replace("/dashboard");
    }
  }, [isLoading, pharmacien, router]);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ImageBackground
        source={require("../assets/images/bg_search.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Medipharma</Text>
              <Text style={styles.tagline}>
                Recevez les recherches de médicaments en temps réel, gérez
                votre stock, servez vos patients.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => router.push("/auth")}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Se connecter"
              >
                <View style={styles.buttonContent}>
                  <MaterialIcons
                    name="local-pharmacy"
                    size={26}
                    color="white"
                  />
                  <Text style={styles.buttonText}>Se connecter</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => router.push("/inscription")}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Créer un compte pharmacien"
              >
                <Text style={styles.buttonSecondaryText}>
                  Créer un compte pharmacien
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Image
                source={require("../assets/images/ajl-groupe.png")}
                style={styles.logoAjl}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveSpacing(20),
    paddingTop: responsiveSpacing(60),
    paddingBottom: responsiveSpacing(40),
    maxWidth: isTablet() ? 800 : "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: responsiveSpacing(20),
  },
  logo: {
    width: responsiveValue(screenWidth * 0.5, screenWidth * 0.35),
    height: responsiveValue(screenWidth * 0.5, screenWidth * 0.35),
    marginBottom: responsiveSpacing(10),
  },
  appName: {
    color: "white",
    fontSize: responsiveValue(34, 42),
    fontWeight: "bold",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: responsiveValue(15, 18),
    textAlign: "center",
    marginTop: responsiveSpacing(10),
    paddingHorizontal: responsiveSpacing(10),
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    maxWidth: responsiveValue(400, 500),
  },
  button: {
    paddingVertical: responsiveSpacing(16),
    paddingHorizontal: responsiveSpacing(30),
    borderRadius: responsiveSpacing(15),
    width: responsiveValue("90%", "80%"),
    alignItems: "center",
    marginBottom: responsiveSpacing(14),
  },
  buttonPrimary: {
    backgroundColor: "#2E7D32",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: responsiveValue(20, 24),
    fontWeight: "bold",
    marginLeft: responsiveSpacing(10),
  },
  buttonSecondaryText: {
    color: "#2E7D32",
    fontSize: responsiveValue(16, 19),
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    marginBottom: responsiveSpacing(20),
  },
  logoAjl: {
    width: responsiveValue(140, 180),
    height: responsiveValue(90, 120),
    borderRadius: responsiveSpacing(15),
    opacity: 0.9,
  },
});
