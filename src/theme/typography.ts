export const fontFamily = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

export const type = {
  display: { fontFamily: fontFamily.extrabold, fontSize: 32, lineHeight: 40 },
  h1: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 33 },
  h2: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28 },
  title: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },

  // GoRush design scale
  screenTitle: { fontFamily: fontFamily.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  headerTitle: { fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 24 },
  sectionLg: { fontFamily: fontFamily.extrabold, fontSize: 17, lineHeight: 22 },
  section: { fontFamily: fontFamily.extrabold, fontSize: 15, lineHeight: 20 },
  itemTitle: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20 },
  itemTitleSm: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 19 },
  amount: { fontFamily: fontFamily.extrabold, fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  metaStrong: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  button: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 20 },
} as const;

export type TypeScale = keyof typeof type;
