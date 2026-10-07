/**
 * Squelettes de chargement (shimmer via l'API Animated standard).
 *
 * Note de synchronisation : fichier dupliqué à l'identique dans
 * Meditrouv et Medipharma.
 */

import { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
} from "react-native";

import { colors, radius, spacing } from "./theme";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  onDark?: boolean;
};

export const Skeleton = ({
  width = "100%",
  height = 16,
  borderRadius = radius.md,
  onDark = false,
}: SkeletonProps) => {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius,
          opacity,
          backgroundColor: onDark ? colors.skeletonOnDark : colors.skeleton,
        },
      ]}
    />
  );
};

type ListSkeletonProps = {
  rows?: number;
  onDark?: boolean;
};

const SKELETON_ROW_IDS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Placeholder de carte : titre + 2 lignes + pied, répété `rows` fois. */
export const ListSkeleton = ({ rows = 4, onDark = false }: ListSkeletonProps) => (
  <View style={styles.list} accessibilityLabel="Chargement en cours">
    {SKELETON_ROW_IDS.slice(0, Math.max(1, rows)).map((rowId) => (
      <View
        key={`skeleton-row-${rowId}`}
        style={[
          styles.card,
          onDark ? styles.cardOnDark : styles.cardOnLight,
        ]}
      >
        <Skeleton width="55%" height={18} onDark={onDark} />
        <View style={styles.gap} />
        <Skeleton width="90%" height={13} onDark={onDark} />
        <View style={styles.gap} />
        <Skeleton width="70%" height={13} onDark={onDark} />
        <View style={styles.gapLarge} />
        <View style={styles.footer}>
          <Skeleton width={110} height={30} borderRadius={radius.full} onDark={onDark} />
          <Skeleton width={70} height={14} onDark={onDark} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardOnLight: {
    backgroundColor: colors.surface,
  },
  cardOnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  gap: {
    height: spacing.sm,
  },
  gapLarge: {
    height: spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
