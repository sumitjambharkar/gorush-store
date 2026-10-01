// GoRush brand palette
export const brand = {
  orange: "#FF5A20",
  orangeDeep: "#E04A12",
  ink: "#121212",
  stone: "#A39E96",
  white: "#FFFFFF",
};

export const semantic = {
  success: "#1DB876",
  warning: "#FFB020",
  danger: "#E5484D",
  info: "#3B82F6",
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderSoft: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textInverted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primaryTint: string;
  primarySoft: string;
  primaryText: string;
  primaryDisabled: string;
  primaryBorder: string;
  accent: string;
  accentTint: string;
  onAccent: string;
  ink: string;
  onInk: string;
  warning: string;
  warningTint: string;
  warningText: string;
  success: string;
  successTint: string;
  successText: string;
  danger: string;
  dangerTint: string;
  dangerText: string;
  info: string;
  infoTint: string;
  overlay: string;
  skeleton: string;
}

// Values follow the GoRush customer app design (WeFast App Screens).
export const light: ThemeColors = {
  background: "#F6F7F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F7F9",
  border: "#E8EAEE",
  borderSoft: "#EEF0F3",

  textPrimary: "#14161A",
  textSecondary: "#5B6170",
  textTertiary: "#8A909C",
  textMuted: "#C9CDD4",
  textInverted: "#FFFFFF",

  primary: brand.orange,
  primaryPressed: brand.orangeDeep,
  onPrimary: "#FFFFFF",
  primaryTint: "#FFF1EB",
  primarySoft: "#FFF7F3",
  primaryText: "#C2410C",
  primaryDisabled: "#FFB394",
  primaryBorder: "#FFC9B3",

  accent: "#14161A",
  accentTint: "#F1F2F4",
  onAccent: "#FFFFFF",

  ink: "#14161A",
  onInk: "#FFFFFF",

  warning: semantic.warning,
  warningTint: "#FFF6E0",
  warningText: "#B7791F",

  success: "#12B76A",
  successTint: "#E7F8EF",
  successText: "#0E8A52",

  danger: semantic.danger,
  dangerTint: "#FDECEC",
  dangerText: "#C0362C",

  info: "#2563EB",
  infoTint: "#EAF1FF",

  overlay: "rgba(20, 22, 26, 0.55)",
  skeleton: "#ECEEF1",
};

export const dark: ThemeColors = {
  background: "#0E0F12",
  surface: "#17191D",
  surfaceAlt: "#1F2227",
  border: "#2C3036",
  borderSoft: "#24272C",

  textPrimary: "#F3F4F6",
  textSecondary: "#A9AEB8",
  textTertiary: "#7D838E",
  textMuted: "#4A4F57",
  textInverted: "#14161A",

  primary: brand.orange,
  primaryPressed: "#FF7A47",
  onPrimary: "#FFFFFF",
  primaryTint: "#3A1D12",
  primarySoft: "#2A1810",
  primaryText: "#FF9A70",
  primaryDisabled: "#7A3A22",
  primaryBorder: "#5C2C1A",

  accent: "#F3F4F6",
  accentTint: "#24272C",
  onAccent: "#14161A",

  ink: "#000000",
  onInk: "#FFFFFF",

  warning: "#FFC24D",
  warningTint: "#3A2E12",
  warningText: "#FFC24D",

  success: "#2FD38A",
  successTint: "#123322",
  successText: "#2FD38A",

  danger: "#FF6B6F",
  dangerTint: "#3A1618",
  dangerText: "#FF8A8D",

  info: "#5B9BFF",
  infoTint: "#152238",

  overlay: "rgba(0, 0, 0, 0.65)",
  skeleton: "#24272C",
};

export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export const ORDER_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "info" },
  preparing: { label: "Preparing", tone: "warning" },
  ready: { label: "Ready", tone: "success" },
  picked_up: { label: "Picked up", tone: "success" },
  delivered: { label: "Delivered", tone: "neutral" },
  rejected: { label: "Rejected", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "danger" },
};
