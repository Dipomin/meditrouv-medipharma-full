import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { QuantitySheet } from "./components/QuantitySheet";
import {
  AppButton,
  AppHeader,
  EmptyState,
  Screen,
  colors,
  fontSize,
  spacing,
  useToast,
} from "./components/ui";
import {
  annuaireAPI,
  commandesAPI,
  type Medicament,
} from "./lib/api";
import { logger } from "./lib/logger";
import { usePharmacienSession } from "./lib/usePharmacienSession";
import { offlineAwareMessage } from "./lib/offline";

export default function CommandeNewScreen() {
  const router = useRouter();
  const { pharmacien, isReady } = usePharmacienSession();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Medicament[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sheetItem, setSheetItem] = useState<Medicament | null>(null);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (isReady && !pharmacien) {
      router.replace("/auth");
    }
  }, [isReady, pharmacien, router]);

  const handleSearch = useCallback(async (): Promise<void> => {
    if (!query.trim()) {
      toast.info("Veuillez entrer le nom d'un médicament.");
      return;
    }
    try {
      setSearching(true);
      setSearched(true);
      const all = await annuaireAPI.searchMedicaments(query.trim());
      // Exclure ma propre pharmacie.
      setResults(
        all.filter((med) => med.idPharmacie !== pharmacien?.pharmacieId)
      );
    } catch (error) {
      logger.error("Échec de la recherche inter-pharmacies.", error);
      toast.error(offlineAwareMessage(error, "Recherche impossible. Réessayez."));
    } finally {
      setSearching(false);
    }
  }, [query, pharmacien, toast]);

  const handleConfirm = useCallback(
    async (order: {
      quantite: number;
      urgence: string;
      notes?: string;
    }): Promise<void> => {
      if (!pharmacien?.pharmacieId || !sheetItem) {
        toast.error("Compte non rattaché à une pharmacie.");
        return;
      }
      setOrdering(true);
      try {
        await commandesAPI.create(pharmacien.id, {
          medicamentNom: sheetItem.nomMedicament,
          quantite: order.quantite,
          pharmacieFournisseuseId: sheetItem.idPharmacie,
          medicamentId: sheetItem.id,
          urgence: order.urgence,
          notes: order.notes,
          telephoneContact: pharmacien.whatsapp,
        });
        toast.success("Commande envoyée à la pharmacie fournisseuse.");
        router.replace("/commandes");
      } catch (error) {
        logger.error("Échec de la commande.", error);
        toast.error(offlineAwareMessage(error, "Commande impossible."));
      } finally {
        setOrdering(false);
      }
    },
    [pharmacien, sheetItem, toast, router]
  );

  return (
    <Screen>
      <AppHeader title="Commander" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Médicament à commander…"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void handleSearch()}
            returnKeyType="search"
            accessibilityLabel="Médicament à commander"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => void handleSearch()}
            disabled={searching}
            accessibilityRole="button"
            accessibilityLabel="Rechercher"
          >
            <MaterialIcons name="search" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.nomMedicament}
                </Text>
                <Text style={styles.quantity}>Qté : {item.quantite}</Text>
              </View>
              <View style={styles.pharmacieRow}>
                <MaterialIcons
                  name="local-pharmacy"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.pharmacie} numberOfLines={1}>
                  {item.pharmacie?.nomPharmacie ??
                    item.pharmacie?.nom_pharmacie ??
                    "Pharmacie"}
                </Text>
              </View>
              {item.prix != null && (
                <Text style={styles.price}>{item.prix} F</Text>
              )}
              <AppButton
                title="Commander"
                onPress={() => setSheetItem(item)}
                fullWidth
                style={styles.orderButton}
                accessibilityLabel={`Commander ${item.nomMedicament}`}
              />
            </View>
          )}
          ListEmptyComponent={
            searched && !searching ? (
              <EmptyState
                icon="search-off"
                title="Aucun médicament trouvé"
                message="Aucun médicament trouvé dans les autres pharmacies."
              />
            ) : null
          }
        />
      </KeyboardAvoidingView>

      <QuantitySheet
        key={sheetItem?.id ?? "none"}
        item={sheetItem}
        ordering={ordering}
        onClose={() => setSheetItem(null)}
        onConfirm={(order) => void handleConfirm(order)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm + 2,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: spacing.xl - 2,
    fontSize: fontSize.lg,
    marginRight: spacing.sm + 2,
    color: colors.text,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md + 2,
    marginBottom: spacing.sm + 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  quantity: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: "600",
  },
  pharmacieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pharmacie: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: "600",
    flex: 1,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.accentText,
    marginBottom: spacing.sm,
  },
  orderButton: {
    marginTop: spacing.xs,
  },
});
