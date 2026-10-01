import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

type Tone = "info" | "warning" | "danger" | "success";

interface BannerProps {
  tone?: Tone;
  title: string;
  description?: string;
}

const iconByTone: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  info: "information-circle",
  warning: "alert-circle",
  danger: "close-circle",
  success: "checkmark-circle",
};

export function Banner({ tone = "info", title, description }: BannerProps) {
  const { colors, spacing, radii, type } = useTheme();

  const toneColors: Record<Tone, { bg: string; fg: string }> = {
    info: { bg: colors.infoTint, fg: colors.info },
    warning: { bg: colors.warningTint, fg: colors.warning },
    danger: { bg: colors.dangerTint, fg: colors.danger },
    success: { bg: colors.successTint, fg: colors.success },
  };

  const c = toneColors[tone];

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: c.bg, borderRadius: radii.lg, padding: spacing.lg },
      ]}
    >
      <Ionicons name={iconByTone[tone]} size={22} color={c.fg} />
      <View style={{ marginLeft: spacing.md, flex: 1 }}>
        <Text style={[type.bodyMedium, { color: c.fg }]}>{title}</Text>
        {description ? (
          <Text style={[type.caption, { color: c.fg, marginTop: 2 }]}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
});
