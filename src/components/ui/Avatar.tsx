import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "@/theme";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name = "", size = 48 }: AvatarProps) {
  const { colors, type } = useTheme();
  const initials = name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primaryTint,
        },
      ]}
    >
      <Text style={[type.headerTitle, { color: colors.primaryText, fontSize: size * 0.34, lineHeight: size * 0.44 }]}>{initials || "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
