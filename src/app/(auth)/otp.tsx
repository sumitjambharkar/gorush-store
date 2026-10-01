import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/theme";
import { ScreenContainer, Button, OtpInput, Banner, KeyboardScroll } from "@/components/ui";
import { authApi, ApiError } from "@/api";
import { useAuthStore } from "@/store";

export default function Otp() {
  const { colors, type, spacing } = useTheme();
  const params = useLocalSearchParams<{ mobile: string; devOtp?: string }>();
  const setMerchant = useAuthStore((s) => s.setMerchant);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleVerify = async () => {
    if (otp.length !== 4 || loading) return;
    setLoading(true);
    setError("");
    try {
      const merchant = await authApi.verifyOtp(params.mobile, otp);
      setMerchant(merchant);
      router.replace(merchant.isSetupComplete ? "/(tabs)" : "/setup");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setSeconds(30);
    await authApi.sendOtp(params.mobile).catch(() => {});
  };

  return (
    <ScreenContainer bg={colors.surface}>
      <KeyboardScroll contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: spacing.xl }}>
        <View>
          <Text style={[type.display, { color: colors.textPrimary }]}>Verify OTP</Text>
          <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Enter the 4-digit code sent to +91 {params.mobile}
          </Text>
        </View>

        {params.devOtp ? <Banner tone="info" title="Dev mode" description={`Your OTP is ${params.devOtp} (no SMS gateway configured yet).`} /> : null}

        <OtpInput length={4} value={otp} onChange={setOtp} />

        {error ? <Text style={[type.caption, { color: colors.dangerText }]}>{error}</Text> : null}

        <Button label="Verify & continue" onPress={handleVerify} disabled={otp.length !== 4} loading={loading} />

        <Pressable onPress={handleResend} disabled={seconds > 0}>
          <Text style={[type.bodyMedium, { color: seconds > 0 ? colors.textTertiary : colors.primary, textAlign: "center" }]}>
            {seconds > 0 ? `Resend OTP in ${seconds}s` : "Resend OTP"}
          </Text>
        </Pressable>
      </KeyboardScroll>
    </ScreenContainer>
  );
}
