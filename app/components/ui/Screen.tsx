/**
 * Gabarit d'écran : zone sûre + fond optionnel + barre de statut.
 * Fond plat menthe par défaut ; le fond image utilise le composant
 * natif (rendu fidèle, contrairement à la version expo-image lavée).
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import type { ReactNode } from "react";
import {
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { colors, globalMenuReserve, withBottomInset } from "./theme";

export type BackgroundSource = number | { uri: string };

type ScreenProps = {
  children: ReactNode;
  background?: BackgroundSource | null;
  statusBarStyle?: "light-content" | "dark-content";
  /** Réserve l'espace du GlobalMenu fixé en bas d'écran. */
  reserveMenuSpace?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Screen = ({
  children,
  background,
  statusBarStyle = "dark-content",
  reserveMenuSpace = false,
  style,
}: ScreenProps) => {
  // Le menu bas grandit de l'inset système : la réserve suit, sinon le
  // bas du contenu passe sous le menu sur les appareils edge-to-edge.
  const insets = useSafeAreaInsets();
  const menuReserve = {
    paddingBottom: withBottomInset(globalMenuReserve, insets.bottom),
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {background ? (
        <ImageBackground
          source={background}
          style={styles.background}
          resizeMode="cover"
        >
          <StatusBar barStyle={statusBarStyle} />
          <View
            style={[
              styles.content,
              reserveMenuSpace && menuReserve,
              style,
            ]}
          >
            {children}
          </View>
        </ImageBackground>
      ) : (
        <View
          style={[styles.content, reserveMenuSpace && menuReserve, style]}
        >
          <StatusBar barStyle={statusBarStyle} />
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  content: {
    flex: 1,
  },
});
