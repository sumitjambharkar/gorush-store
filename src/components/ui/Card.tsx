import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ style, elevated = false, padded = true, children, ...rest }: CardProps) {
  const { colors, radii, spacing, shadows } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          padding: padded ? spacing.lg : 0,
        },
        elevated ? shadows.card : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
