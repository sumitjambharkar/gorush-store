import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = "cube-outline", title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors, spacing, type, radii } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.primaryTint, borderRadius: radii.xxl, marginBottom: spacing.lg },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[type.title, { color: colors.textPrimary, textAlign: "center" }]}>{title}</Text>
      {description ? (
        <Text
          style={[
            type.body,
            { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
});
