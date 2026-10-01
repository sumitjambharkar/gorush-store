import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { Icon, IconName, ListGroup, ListRow, Switch } from "@/components/ui";
import { storeApi, ApiError } from "@/api";
import { useAuthStore } from "@/store";
import { Merchant } from "@/types";

type SettingKey = "autoAccept" | "busyMode" | "loudAlerts";

export default function Store() {
  const { colors, type } = useTheme();
  const merchant = useAuthStore((s) => s.merchant);
  const setMerchant = useAuthStore((s) => s.setMerchant);
  const signOut = useAuthStore((s) => s.signOut);
  const [saving, setSaving] = useState<SettingKey | null>(null);

  useFocusEffect(
    useCallback(() => {
      storeApi.getMe().then((res) => setMerchant(res.data)).catch(() => {});
    }, [setMerchant])
  );

  if (!merchant) return null;

  const toggles: { key: SettingKey; icon: IconName; title: string; sub: string }[] = [
    { key: "autoAccept", icon: "bolt", title: "Auto-accept orders", sub: `Accept instantly with ${merchant.suggestedPrepMinutes} min prep` },
    { key: "busyMode", icon: "hourglass-top", title: "Busy mode", sub: `Adds +${merchant.busyExtraMinutes} min to prep estimates` },
    { key: "loudAlerts", icon: "notifications-active", title: "Loud order alerts", sub: "Ring until every new order is handled" },
  ];

  const setSetting = async (key: SettingKey, value: boolean) => {
    const prev = merchant;
    const optimistic: Merchant = { ...merchant, settings: { ...merchant.settings, [key]: value } };
    setMerchant(optimistic);
    setSaving(key);
    try {
      const res = await storeApi.updateSettings({ [key]: value });
      setMerchant(res.data);
    } catch (err) {
      setMerchant(prev);
      Alert.alert("Couldn't save", err instanceof ApiError ? err.message : "Try again");
    } finally {
      setSaving(null);
    }
  };

  const logout = () =>
    Alert.alert("Log out?", "You'll stop getting order alerts on this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);

  const a = merchant.address;
  const place = [a.addressLine, a.area].filter(Boolean).join(", ");
  const price = "₹".repeat(merchant.priceLevel || 2);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 16 }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Store</Text>

        <View style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
          <View style={[styles.cover, { backgroundColor: colors.primaryTint }]}>
            <Icon name="storefront" size={44} color={colors.primary} />
          </View>
          <View style={{ padding: 16, gap: 2 }}>
            <Text style={[type.headerTitle, { color: colors.textPrimary }]}>{merchant.storeName}</Text>
            <Text style={[type.meta, { color: colors.textSecondary }]} numberOfLines={2}>
              {[merchant.cuisine, price, place].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </View>

        <ListGroup>
          {toggles.map((t) => (
            <View key={t.key} style={styles.toggleRow}>
              <Icon name={t.icon} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>{t.title}</Text>
                <Text style={[type.meta, { color: colors.textTertiary }]}>{t.sub}</Text>
              </View>
              <Switch value={merchant.settings[t.key]} onChange={(v) => setSetting(t.key, v)} disabled={saving === t.key} small />
            </View>
          ))}
        </ListGroup>

        <ListGroup>
          <ListRow icon="edit" title="Store details & address" onPress={() => router.push({ pathname: "/setup", params: { mode: "edit" } })} />
          <ListRow
            icon="schedule"
            title="Opening hours"
            meta={`${merchant.openingHours.open} – ${merchant.openingHours.close}`}
            onPress={() => router.push({ pathname: "/setup", params: { mode: "edit" } })}
          />
          <ListRow icon="phone" title="Store mobile" meta={`+91 ${merchant.mobile}`} />
          <ListRow icon="logout" title="Log out" danger onPress={logout} />
        </ListGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  storeCard: { borderRadius: 22, borderWidth: 1, overflow: "hidden" },
  cover: { height: 110, alignItems: "center", justifyContent: "center" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
});
