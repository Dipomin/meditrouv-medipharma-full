/**
 * Bannière « hors connexion » affichée quand le réseau est indisponible.
 * Se monte une fois dans `_layout.tsx`, au-dessus de la navigation.
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { useNetInfo } from "@react-native-community/netinfo";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontSize, spacing } from "./theme";

export const OfflineBanner = () => {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  // `isConnected` vaut null avant la première mesure : on n'affiche rien
  // tant que l'état est inconnu pour éviter un flash au démarrage.
  if (netInfo.isConnected !== false) {
    return null;
  }

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + spacing.sm }]}
      accessibilityRole="alert"
      accessibilityLabel="Hors connexion"
    >
      <MaterialIcons name="wifi-off" size={18} color={colors.surface} />
      <Text style={styles.text}>
        Hors connexion — vérifiez votre connexion internet.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginLeft: spacing.sm,
    textAlign: "center",
  },
});
