/**
 * Feuille de réponse à une requête : disponibilité + cotation par ligne
 * (quantité proposée, prix unitaire), total, message, contact.
 */

import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { LigneDemande } from "../lib/api";
import { AppButton, AppSheet, AppTextField } from "./ui";
import { colors, fontSize, spacing } from "./ui/theme";

export type PropositionLigneEnvoi = {
  medicamentNom: string;
  quantiteProposee: number;
  prixUnitaire: number | null;
  disponible: boolean;
  ligneDemandeId: string;
};

type PropositionSheetProps = {
  lignes: LigneDemande[];
  sending: boolean;
  telephoneDefaut?: string;
  onClose: () => void;
  onConfirm: (data: {
    lignes: PropositionLigneEnvoi[];
    prixTotal: number | null;
    message?: string;
    telephoneContact?: string;
  }) => void;
};

type Draft = {
  ligneDemandeId: string;
  medicamentNom: string;
  quantiteDemandee: number;
  quantiteProposee: string;
  prixUnitaire: string;
  disponible: boolean;
};

const parseEntier = (value: string): number | null => {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

export const PropositionSheet = ({
  lignes,
  sending,
  telephoneDefaut,
  onClose,
  onConfirm,
}: PropositionSheetProps) => {
  // État initial frais par requête : le parent remonte avec `key={id}`.
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    lignes.map((ligne) => ({
      ligneDemandeId: ligne.id,
      medicamentNom: ligne.medicamentNom,
      quantiteDemandee: ligne.quantite,
      quantiteProposee: String(ligne.quantite),
      prixUnitaire: "",
      disponible: true,
    }))
  );
  const [prixTotal, setPrixTotal] = useState("");
  const [message, setMessage] = useState("");
  const [telephone, setTelephone] = useState(telephoneDefaut ?? "");
  const [erreur, setErreur] = useState<string | null>(null);

  const patch = (index: number, part: Partial<Draft>): void => {
    setDrafts((previous) =>
      previous.map((draft, i) => (i === index ? { ...draft, ...part } : draft))
    );
  };

  const totalCalcule = useMemo(
    () =>
      drafts.reduce((somme, draft) => {
        if (!draft.disponible) {
          return somme;
        }
        const quantite = parseEntier(draft.quantiteProposee);
        const prix = parseEntier(draft.prixUnitaire);
        if (quantite === null || prix === null) {
          return somme;
        }
        return somme + quantite * prix;
      }, 0),
    [drafts]
  );

  const handleConfirm = (): void => {
    const disponibles = drafts.filter((draft) => draft.disponible);
    if (disponibles.length === 0) {
      setErreur("Sélectionnez au moins un médicament disponible.");
      return;
    }
    const envoi: PropositionLigneEnvoi[] = [];
    for (const draft of disponibles) {
      const quantite = parseEntier(draft.quantiteProposee);
      if (quantite === null || quantite < 1) {
        setErreur(`Quantité invalide pour « ${draft.medicamentNom} ».`);
        return;
      }
      const prix =
        draft.prixUnitaire.trim() === ""
          ? null
          : parseEntier(draft.prixUnitaire);
      if (prix === null && draft.prixUnitaire.trim() !== "") {
        setErreur(`Prix invalide pour « ${draft.medicamentNom} ».`);
        return;
      }
      envoi.push({
        medicamentNom: draft.medicamentNom,
        quantiteProposee: quantite,
        prixUnitaire: prix,
        disponible: true,
        ligneDemandeId: draft.ligneDemandeId,
      });
    }
    const total =
      prixTotal.trim() === "" ? null : parseEntier(prixTotal);
    if (total === null && prixTotal.trim() !== "") {
      setErreur("Total invalide.");
      return;
    }
    setErreur(null);
    onConfirm({
      lignes: envoi,
      prixTotal: total,
      message: message.trim() || undefined,
      telephoneContact: telephone.trim() || undefined,
    });
  };

  return (
    <AppSheet
      visible
      onClose={onClose}
      title="Répondre avec ma cotation"
      accessibilityLabel="Répondre à la requête"
    >
      {drafts.map((draft, index) => (
        <View key={draft.ligneDemandeId} style={styles.ligne}>
          <TouchableOpacity
            style={styles.dispoRow}
            onPress={() => patch(index, { disponible: !draft.disponible })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.disponible }}
            accessibilityLabel={`Disponible : ${draft.medicamentNom}`}
          >
            <MaterialIcons
              name={
                draft.disponible ? "check-box" : "check-box-outline-blank"
              }
              size={24}
              color={draft.disponible ? colors.primary : colors.textMuted}
            />
            <Text style={styles.ligneNom} numberOfLines={1}>
              {draft.medicamentNom} (demandé : {draft.quantiteDemandee})
            </Text>
          </TouchableOpacity>
          {draft.disponible && (
            <View style={styles.champs}>
              <AppTextField
                label="Qté proposée"
                value={draft.quantiteProposee}
                onChangeText={(value) =>
                  patch(index, { quantiteProposee: value })
                }
                keyboardType="numeric"
                containerStyle={styles.champ}
              />
              <AppTextField
                label="Prix unit. (F)"
                value={draft.prixUnitaire}
                onChangeText={(value) => patch(index, { prixUnitaire: value })}
                keyboardType="numeric"
                placeholder="Optionnel"
                containerStyle={styles.champ}
              />
            </View>
          )}
        </View>
      ))}

      <Text style={styles.total}>Total calculé : {totalCalcule} F</Text>
      <AppTextField
        label="Total proposé (F, optionnel)"
        value={prixTotal}
        onChangeText={setPrixTotal}
        keyboardType="numeric"
        placeholder="Laisser vide = total calculé"
      />
      <AppTextField
        label="Message (optionnel)"
        value={message}
        onChangeText={setMessage}
        placeholder="Délai, remise, conditions…"
        multiline
        numberOfLines={2}
      />
      <AppTextField
        label="Mon contact (optionnel)"
        value={telephone}
        onChangeText={setTelephone}
        keyboardType="phone-pad"
        placeholder="WhatsApp / téléphone"
      />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
      <AppButton
        title="Envoyer ma proposition"
        onPress={handleConfirm}
        loading={sending}
        fullWidth
        accessibilityLabel="Envoyer ma proposition"
      />
    </AppSheet>
  );
};

const styles = StyleSheet.create({
  ligne: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  dispoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ligneNom: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  champs: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  champ: {
    flex: 1,
    marginRight: spacing.sm,
  },
  total: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.accentText,
    textAlign: "center",
    marginVertical: spacing.sm,
  },
  erreur: {
    fontSize: fontSize.md,
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
});
