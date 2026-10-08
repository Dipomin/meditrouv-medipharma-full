import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import {
  DEFAULT_SPLASH_DURATION_MS,
  SPLASH_FADE_MS,
  splashDismissDelay,
  splashPauseDuration,
} from "../lib/splash";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export default function SplashScreen({
  onFinish,
  duration = DEFAULT_SPLASH_DURATION_MS,
}: SplashScreenProps) {
  // Valeur stable via useState : pas de lecture de ref pendant le rendu.
  const [fadeAnim] = useState(() => new Animated.Value(0));
  // Référence vers le rappel courant (affectée dans l'effet uniquement).
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
    // Fermeture garantie par minuterie, même si le rappel de fin
    // d'animation natif n'est jamais invoqué (blocage constaté sur
    // appareil : l'appli restait figée sur le logo).
    const dismissTimer = setTimeout(() => {
      onFinishRef.current();
    }, splashDismissDelay(duration));
    // Animation purement décorative : sa fin ne conditionne plus rien.
    const animation = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }),
      Animated.delay(splashPauseDuration(duration)), // Attendre
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => {
      clearTimeout(dismissTimer);
      animation.stop();
    };
    // onFinish inclus : un éventuel redémarrage (re-rendu parent) relance
    // la minuterie, la fermeture restant garantie dans tous les cas.
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
