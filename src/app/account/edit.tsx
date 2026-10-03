import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { goBack } from "@/utils/nav";
import { useTheme } from "@/theme";
import { ScreenContainer, Avatar, Banner, Button, Icon, ScreenHeader, TextField, KeyboardScroll, KeyboardFooter, FOOTER_OFFSET } from "@/components/ui";
import { storeApi, ApiError } from "@/api";
import { useAuthStore } from "@/store";

// Owner profile + login mobile. Store name, address and hours live on "Store details".
export default function EditOwnerProfile() {
  const { colors, type, spacing } = useTheme();
  const merchant = useAuthStore((s) => s.merchant);
  const setMerchant = useAuthStore((s) => s.setMerchant);
  const [ownerName, setOwnerName] = useState(merchant?.ownerName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const changed = ownerName.trim() !== (merchant?.ownerName ?? "");

  const save = async () => {
    if (!ownerName.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await storeApi.updateMe({ ownerName: ownerName.trim() });
      setMerchant(res.data);
      goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom"]} padded={false} bg={colors.surface}>
      <ScreenHeader title="Owner profile" onBack={() => goBack()} />
      <KeyboardScroll bottomOffset={FOOTER_OFFSET} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: spacing.lg }}>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Avatar name={ownerName || merchant?.storeName || "?"} size={80} />
        </View>

        <TextField label="Owner name" value={ownerName} onChangeText={setOwnerName} placeholder="Your full name" error={!ownerName.trim() ? "Name is required" : undefined} />

        <View style={{ gap: 6 }}>
          <Text style={[type.captionMedium, { color: colors.textSecondary }]}>Login mobile number</Text>
          <Pressable onPress={() => router.push("/account/mobile")} style={[styles.mobile, { borderColor: colors.border }]}>
            <Text style={[type.bodyLarge, { color: colors.textPrimary, flex: 1 }]}>+91 {merchant?.mobile}</Text>
            <Text style={[type.itemTitleSm, { color: colors.primary }]}>Change</Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
          <Text style={[type.meta, { color: colors.textTertiary }]}>
            Riders and customers call this number. Changing it needs an OTP sent to the new number.
          </Text>
        </View>

        <Pressable onPress={() => router.push({ pathname: "/setup", params: { mode: "edit" } })} style={[styles.link, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="storefront" size={20} color={colors.textSecondary} />
          <Text style={[type.caption, { color: colors.textSecondary, flex: 1 }]}>Store name, address and opening hours are under Store details.</Text>
          <Icon name="chevron-right" size={20} color={colors.textTertiary} />
        </Pressable>

        {error ? <Banner tone="danger" title="Couldn't save" description={error} /> : null}
      </KeyboardScroll>
      <KeyboardFooter style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft }}>
        <Button label="Save changes" onPress={save} disabled={!changed || !ownerName.trim()} loading={saving} />
      </KeyboardFooter>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mobile: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 56, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16 },
  link: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16 },
});
