import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function TextField({ label, error, leftIcon, rightIcon, style, ...rest }: TextFieldProps) {
  const { colors, radii, spacing, type } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[type.captionMedium, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.container,
          {
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[type.bodyLarge, { flex: 1, color: colors.textPrimary, paddingVertical: spacing.md }, style]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon}
      </View>
      {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 56,
  },
});
