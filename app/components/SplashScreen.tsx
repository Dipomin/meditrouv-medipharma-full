import React, { useEffect, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export default function SplashScreen({
  onFinish,
  duration = 3000,
}: SplashScreenProps) {
  // Valeur stable via useState : pas de lecture de ref pendant le rendu.
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Pause bornée (jamais négative si duration < 2000).
    const pause = Math.max(0, duration - 2000);
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const animation = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(pause), // Attendre
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);
    // Animation d'apparition du logo
    animation.start(() => {
      // Appeler la fonction onFinish après l'animation
      finishTimer = setTimeout(() => {
        onFinish();
      }, 100); // Petit délai pour assurer une transition fluide
    });
    return () => {
      animation.stop();
      if (finishTimer) {
        clearTimeout(finishTimer);
      }
    };
  }, [fadeAnim, duration, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#90c8b2",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
