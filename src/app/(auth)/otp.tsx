import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/theme";
import { ScreenContainer, Button, OtpInput, Banner, KeyboardScroll } from "@/components/ui";
import { authApi, ApiError } from "@/api";
import { OTP_LENGTH, RESEND_SECONDS, formatCountdown, retryAfterSeconds } from "@/utils/otp";
import { useAuthStore } from "@/store";

export default function Otp() {
  const { colors, type, spacing } = useTheme();
  const params = useLocalSearchParams<{ mobile: string; devOtp?: string; resend?: string }>();
  const setMerchant = useAuthStore((s) => s.setMerchant);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(() => Number(params.resend) || RESEND_SECONDS);
  const [notice, setNotice] = useState("");
  const [devOtp, setDevOtp] = useState(params.devOtp ?? "");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // `code` comes straight from the input when it auto-completes (state may lag).
  const handleVerify = async (code: string = otp) => {
    if (code.length !== OTP_LENGTH || loading) return;
    setLoading(true);
    setError("");
    try {
      const merchant = await authApi.verifyOtp(params.mobile, code);
      setMerchant(merchant);
      router.replace(merchant.isSetupComplete ? "/(tabs)" : "/setup");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError("");
    setNotice("");
    try {
      const res = await authApi.sendOtp(params.mobile);
      setSeconds(res.data.resendAfterSeconds ?? RESEND_SECONDS);
      setDevOtp(res.data.devOtp ?? "");
      setOtp("");
      setNotice(`A new OTP has been sent to +91 ${params.mobile}`);
    } catch (err) {
      const wait = retryAfterSeconds(err);
      if (wait) setSeconds(wait);
      setError(err instanceof ApiError ? err.message : "Couldn't resend the OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenContainer bg={colors.surface}>
      <KeyboardScroll contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: spacing.xl }}>
        <View>
          <Text style={[type.display, { color: colors.textPrimary }]}>Verify OTP</Text>
          <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Enter the 6-digit code sent to +91 {params.mobile}
          </Text>
        </View>

        {devOtp ? <Banner tone="info" title="Dev mode" description={`Your OTP is ${devOtp} (SMS isn't configured on this server).`} /> : null}

        <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} onComplete={(code) => handleVerify(code)} />

        {error ? <Text style={[type.caption, { color: colors.dangerText }]}>{error}</Text> : null}

        <Button label="Verify & continue" onPress={() => handleVerify()} disabled={otp.length !== OTP_LENGTH} loading={loading} />

        {notice ? <Text style={[type.caption, { color: colors.textSecondary, textAlign: "center" }]}>{notice}</Text> : null}

        <Pressable onPress={handleResend} disabled={seconds > 0 || resending} hitSlop={8}>
          <Text style={[type.bodyMedium, { color: seconds > 0 || resending ? colors.textTertiary : colors.primary, textAlign: "center" }]}>
            {resending ? "Sending…" : seconds > 0 ? `Resend OTP in ${formatCountdown(seconds)}` : "Didn't get it? Resend OTP"}
          </Text>
        </Pressable>
      </KeyboardScroll>
    </ScreenContainer>
  );
}
