import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { light, dark, ThemeColors } from "./colors";
import { spacing, radii } from "./spacing";
import { shadows } from "./shadows";
import { type, fontFamily } from "./typography";

export * from "./colors";
export * from "./typography";
export { spacing, radii, shadows };

type Scheme = "light" | "dark";

export interface Theme {
  scheme: Scheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  type: typeof type;
  fontFamily: typeof fontFamily;
}

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(scheme: Scheme): Theme {
  return {
    scheme,
    colors: scheme === "dark" ? dark : light,
    spacing,
    radii,
    shadows,
    type,
    fontFamily,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: Scheme = systemScheme === "dark" ? "dark" : "light";
  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
