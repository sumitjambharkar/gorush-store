import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

/** Indian veg / non-veg mark: green or red dot in a square. */
export function VegMark({ veg }: { veg: boolean }) {
  const { colors } = useTheme();
  const c = veg ? colors.success : colors.dangerText;
  return (
    <View style={[styles.box, { borderColor: c }]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 12, height: 12, borderWidth: 1.5, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
