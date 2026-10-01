import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, View, GestureResponderEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  /** Right-aligned text, e.g. a price ("Continue with Bike · ₹49"). */
  trailing?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  trailing,
}: ButtonProps) {
  const { colors, radii, type, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const backgrounds: Record<Variant, string> = {
    primary: isDisabled && !loading ? colors.primaryDisabled : colors.primary,
    secondary: colors.primaryTint,
    ghost: "transparent",
    danger: colors.danger,
  };

  const textColors: Record<Variant, string> = {
    primary: colors.onPrimary,
    secondary: colors.primaryText,
    ghost: colors.textPrimary,
    danger: "#FFFFFF",
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderRadius: radii.lg,
          height: size === "lg" ? 56 : 48,
          paddingHorizontal: spacing.xl,
          opacity: isDisabled && variant !== "primary" ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          borderWidth: variant === "ghost" ? 1.5 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <View style={[styles.row, trailing ? styles.spread : null]}>
          <View style={styles.row}>
            {icon}
            <Text style={[type.button, { color: textColors[variant], marginLeft: icon ? spacing.sm : 0 }]}>
              {label}
            </Text>
          </View>
          {trailing ? <Text style={[type.button, { color: textColors[variant] }]}>{trailing}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spread: { alignSelf: "stretch", justifyContent: "space-between" },
});
