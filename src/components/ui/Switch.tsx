import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

/** Green pill toggle from the design (52×32). */
export function Switch({
  value,
  onChange,
  disabled,
  small,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  small?: boolean;
}) {
  const { colors } = useTheme();
  const w = small ? 44 : 52;
  const h = small ? 26 : 32;
  const k = h - 6;
  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[styles.track, { width: w, height: h, borderRadius: h / 2, backgroundColor: value ? colors.success : colors.textMuted, opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.knob, { width: k, height: k, borderRadius: k / 2, left: value ? w - k - 3 : 3 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { justifyContent: "center" },
  knob: { position: "absolute", top: 3, backgroundColor: "#FFFFFF", elevation: 2 },
});
