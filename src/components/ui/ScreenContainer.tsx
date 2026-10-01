import React from "react";
import { View, ViewStyle } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  padded?: boolean;
  /** Screen background; defaults to the theme background. */
  bg?: string;
}

export function ScreenContainer({ children, edges = ["top", "bottom"], style, padded = true, bg }: ScreenContainerProps) {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg ?? colors.background }}>
      <View style={[{ flex: 1, paddingHorizontal: padded ? spacing.xl : 0 }, style]}>{children}</View>
    </SafeAreaView>
  );
}
