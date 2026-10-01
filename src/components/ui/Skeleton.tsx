import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/theme";

export function Skeleton({ width, height, radius = 8, style }: { width: number | `${number}%`; height: number; radius?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { spacing, radii, colors } = useTheme();
  return (
    <View style={{ padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.xl, gap: spacing.sm }}>
      <View style={styles.row}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ marginLeft: spacing.md, flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
