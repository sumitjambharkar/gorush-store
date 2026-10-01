import React from "react";
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

/*
 * Building blocks of the GoRush customer design (WeFast App Screens C05–C14).
 * Icons come from MaterialIcons, which carries the same glyphs as the
 * design's Material Symbols.
 */

export type IconName = keyof typeof MaterialIcons.glyphMap;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <MaterialIcons name={name} size={size} color={color ?? colors.textPrimary} />;
}

/** 42px rounded-square icon button (back, chat, call …). */
export function IconButton({
  icon,
  onPress,
  tone = "muted",
  size = 42,
  floating,
  disabled,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  tone?: "muted" | "surface" | "primary" | "success";
  size?: number;
  floating?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, shadows } = useTheme();
  const bg = { muted: colors.surfaceAlt, surface: colors.surface, primary: colors.primary, success: colors.success }[tone];
  const fg = tone === "primary" || tone === "success" ? colors.onPrimary : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: 14, backgroundColor: bg, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 },
        floating ? shadows.card : null,
        style,
      ]}
    >
      <Icon name={icon} size={22} color={fg} />
    </Pressable>
  );
}

/** Back button + title row used at the top of stack screens. */
export function ScreenHeader({
  title,
  onBack,
  right,
  style,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, type } = useTheme();
  return (
    <View style={[styles.header, style]}>
      {onBack ? <IconButton icon="arrow-back" onPress={onBack} /> : null}
      {title ? <Text style={[type.headerTitle, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

/** Square tinted tile holding an icon. */
export function IconTile({
  icon,
  bg,
  fg,
  size = 42,
  radius = 14,
  iconSize = 22,
  bordered,
}: {
  icon: IconName;
  bg?: string;
  fg?: string;
  size?: number;
  radius?: number;
  iconSize?: number;
  bordered?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg ?? colors.primaryTint,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: bordered ? 1 : 0,
        borderColor: colors.borderSoft,
      }}
    >
      <Icon name={icon} size={iconSize} color={fg ?? colors.primary} />
    </View>
  );
}

/** Grey track with a raised white segment (Active / Past, weight buckets). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  height = 40,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  height?: number;
}) {
  const { colors, type, shadows } = useTheme();
  return (
    <View style={[styles.segTrack, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.segItem,
              { height, backgroundColor: on ? colors.surface : "transparent" },
              on ? shadows.subtle : null,
            ]}
          >
            <Text style={[type.itemTitleSm, { fontSize: 13, color: on ? colors.textPrimary : colors.textTertiary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Outlined choice chip; selected = orange outline on a soft orange fill. */
export function SelectChip({
  label,
  icon,
  selected,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, type } = useTheme();
  const fg = selected ? colors.primaryText : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[type.itemTitleSm, { fontSize: 13, color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Selectable card with an icon tile, title/subtitle and a radio dot. */
export function OptionRow({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, type } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface }]}
    >
      <IconTile icon={icon} bg={colors.surfaceAlt} fg={colors.textPrimary} size={44} iconSize={24} />
      <View style={{ flex: 1 }}>
        <Text style={[type.itemTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[type.meta, { color: colors.textSecondary, marginTop: 1 }]}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.textMuted }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

/** White rounded group that stacks ListRows with hairline dividers. */
export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.borderSoft }, style]}>
      {items.map((child, i) => (
        <View key={i} style={i < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.accentTint } : null}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  meta,
  onPress,
  danger,
  chevron,
}: {
  icon: IconName;
  title: string;
  meta?: string;
  onPress?: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  const { colors, type, fontFamily } = useTheme();
  const fg = danger ? colors.dangerText : colors.textPrimary;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={22} color={fg} />
      <Text style={[type.bodyMedium, { fontFamily: fontFamily.semibold, color: fg, flex: 1 }]}>{title}</Text>
      {meta ? <Text style={[type.caption, { color: colors.textTertiary }]}>{meta}</Text> : null}
      {chevron ?? !!onPress ? <Icon name="chevron-right" size={20} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

/** Bottom action area with a hairline top border and safe-area padding. */
export function BottomBar({ children, bordered = true }: { children: React.ReactNode; bordered?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12) + 4,
        backgroundColor: colors.surface,
        borderTopWidth: bordered ? 1 : 0,
        borderTopColor: colors.borderSoft,
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}

/** Grabber shown at the top of sheet-style panels. */
export function SheetHandle() {
  const { colors } = useTheme();
  return <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" }} />;
}

/** Pickup (green dot) / drop (orange square) markers used in route cards. */
export function RouteDot({ kind }: { kind: "pickup" | "drop" }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 12,
        height: 12,
        borderRadius: kind === "pickup" ? 6 : 3,
        backgroundColor: kind === "pickup" ? colors.success : colors.primary,
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  segTrack: { flexDirection: "row", borderRadius: 14, padding: 4 },
  segItem: { flex: 1, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  group: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
});
