import { useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { useTheme, brand } from "@/theme";
import { ScreenContainer, Button, TextField, KeyboardScroll } from "@/components/ui";
import { authApi, ApiError } from "@/api";

export default function Login() {
  const { colors, type, spacing, scheme } = useTheme();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = /^[0-9]{10}$/.test(mobile);

  const handleContinue = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await authApi.sendOtp(mobile);
      router.push({ pathname: "/(auth)/otp", params: { mobile, devOtp: res.data.devOtp ?? "" } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer bg={colors.surface}>
      <KeyboardScroll contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={[styles.brandRow, { marginBottom: spacing.xxxl }]}>
          <Image source={require("../../../assets/images/logo-tile-orange.png")} style={styles.brandTile} />
          <View style={{ marginLeft: spacing.md }}>
            <Image
              source={scheme === "dark" ? require("../../../assets/images/wordmark-dark.png") : require("../../../assets/images/wordmark-light.png")}
              style={styles.wordmark}
              resizeMode="contain"
            />
            <Text style={styles.tag}>STORE</Text>
          </View>
        </View>
        <Text style={[type.display, { color: colors.textPrimary }]}>Store login</Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xxxl }]}>
          Enter your mobile number to manage orders, menu and payouts.
        </Text>

        <TextField
          label="Mobile number"
          placeholder="98765 43210"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ""))}
          leftIcon={
            <View style={[styles.prefix, { borderRightColor: colors.border }]}>
              <Text style={[type.bodyLarge, { color: colors.textPrimary }]}>+91</Text>
            </View>
          }
          error={error}
        />

        <View style={{ marginTop: spacing.xxl }}>
          <Button label="Send OTP" onPress={handleContinue} disabled={!canSubmit} loading={loading} />
        </View>
      </KeyboardScroll>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  prefix: { marginRight: 8, paddingRight: 8, borderRightWidth: 1 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandTile: { width: 56, height: 56 },
  wordmark: { width: 158, height: (158 * 126) / 906 },
  tag: { color: brand.stone, fontSize: 11, fontWeight: "700", letterSpacing: 5, marginTop: 6 },
});
