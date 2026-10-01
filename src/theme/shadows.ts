import { Platform } from "react-native";

const card = Platform.select({
  ios: {
    shadowColor: "#121212",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  default: {},
});

const floating = Platform.select({
  ios: {
    shadowColor: "#121212",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
  default: {},
});

const subtle = Platform.select({
  ios: {
    shadowColor: "#121212",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  android: { elevation: 1 },
  default: {},
});

export const shadows = { card, floating, subtle } as const;
