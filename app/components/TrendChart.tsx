/**
 * Mini-graphique de tendances : barres d'alertes par jour (sans librairie).
 * Conçu pour carte blanche (contraste du vert).
 */

import { StyleSheet, Text, View } from "react-native";

import { bucketTotal, type DayBucket } from "../lib/trends";
import { colors, fontSize, spacing } from "./ui/theme";

const CHART_HEIGHT = 110;

type TrendChartProps = {
  buckets: readonly DayBucket[];
  title: string;
};

export const TrendChart = ({ buckets, title }: TrendChartProps) => {
  const max = buckets.reduce(
    (peak, bucket) => Math.max(peak, bucket.count),
    0
  );
  const total = bucketTotal(buckets);

  return (
    <View accessibilityLabel={`${title} : ${total} alertes`}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.total}>{total}</Text>
      </View>
      <View style={styles.chart}>
        {buckets.map((bucket) => {
          const ratio = max > 0 ? bucket.count / max : 0;
          const isToday = bucket.label === "Auj.";
          return (
            <View key={bucket.key} style={styles.column}>
              <Text style={styles.value}>
                {bucket.count > 0 ? String(bucket.count) : ""}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    isToday ? styles.barToday : styles.barPast,
                    { height: `${Math.max(bucket.count > 0 ? 6 : 0, ratio * 100)}%` },
                  ]}
                />
              </View>
              <Text
                style={[styles.day, isToday && styles.dayToday]}
                numberOfLines={1}
              >
                {bucket.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  total: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    color: colors.primary,
  },
  chart: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  column: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  value: {
    fontSize: fontSize.caption,
    fontWeight: "700",
    color: colors.primary,
    height: 16,
  },
  track: {
    height: CHART_HEIGHT,
    width: "62%",
    maxWidth: 26,
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
  },
  barPast: {
    backgroundColor: colors.primary,
    opacity: 0.55,
  },
  barToday: {
    backgroundColor: colors.accent,
  },
  day: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  dayToday: {
    color: colors.accentText,
    fontWeight: "700",
  },
});
