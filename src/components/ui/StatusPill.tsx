import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

interface StatusPillProps {
  label: string;
  tone?: Tone;
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  const { colors, type } = useTheme();

  const tones: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.accentTint, fg: colors.textSecondary },
    info: { bg: colors.primaryTint, fg: colors.primaryText },
    warning: { bg: colors.primaryTint, fg: colors.primaryText },
    success: { bg: colors.successTint, fg: colors.successText },
    danger: { bg: colors.dangerTint, fg: colors.dangerText },
  };

  const c = tones[tone];

  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[type.metaStrong, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
