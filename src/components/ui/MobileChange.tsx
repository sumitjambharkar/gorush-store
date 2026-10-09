import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/theme";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { OtpInput } from "./OtpInput";
import { TextField } from "./TextField";
import { OTP_LENGTH, RESEND_SECONDS, formatCountdown, retryAfterSeconds } from "@/utils/otp";

/*
 * Two-step "change mobile number" form: enter the new number → enter the OTP
 * sent to it. The caller supplies the API calls; `verify` should persist the
 * updated profile before resolving.
 */
export function MobileChangeForm({
  currentMobile,
  request,
  verify,
  onDone,
}: {
  currentMobile?: string;
  request: (mobile: string) => Promise<{ devOtp?: string; resendAfterSeconds?: number }>;
  verify: (mobile: string, otp: string) => Promise<void>;
  onDone: () => void;
}) {
  const { colors, type, spacing } = useTheme();
  const [step, setStep] = useState<"number" | "otp">("number");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const valid = /^[0-9]{10}$/.test(mobile) && mobile !== currentMobile;

  const send = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await request(mobile);
      setDevOtp(res.devOtp ?? "");
      setOtp("");
      setStep("otp");
      setSeconds(res.resendAfterSeconds ?? RESEND_SECONDS);
    } catch (err) {
      const wait = retryAfterSeconds(err);
      if (wait) setSeconds(wait);
      setError(err instanceof Error ? err.message : "Couldn't send the OTP");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (code: string = otp) => {
    if (code.length !== OTP_LENGTH || busy) return;
    setBusy(true);
    setError("");
    try {
      await verify(mobile, code);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify the OTP");
    } finally {
      setBusy(false);
    }
  };

  if (step === "number") {
    return (
      <View style={{ gap: spacing.lg }}>
        {currentMobile ? (
          <Text style={[type.caption, { fontSize: 14, color: colors.textSecondary }]}>Current number: +91 {currentMobile}</Text>
        ) : null}
        <TextField
          label="New mobile number"
          placeholder="98765 43210"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ""))}
          leftIcon={<Text style={[type.bodyLarge, { color: colors.textPrimary, marginRight: 8 }]}>+91</Text>}
          error={mobile.length === 10 && mobile === currentMobile ? "That's your current number" : error}
          autoFocus
        />
        <Text style={[type.meta, { color: colors.textTertiary }]}>{"We'll send a 6-digit code to the new number to confirm it's yours."}</Text>
        <Button
          label={seconds > 0 ? `Send OTP in ${formatCountdown(seconds)}` : "Send OTP"}
          onPress={send}
          disabled={!valid || seconds > 0}
          loading={busy}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={[type.caption, { fontSize: 14, color: colors.textSecondary }]}>Enter the 6-digit code sent to +91 {mobile}</Text>
      {devOtp ? <Banner tone="info" title="Dev mode" description={`Your OTP is ${devOtp} (SMS isn't configured on this server).`} /> : null}
      <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} onComplete={(code) => confirm(code)} />
      {error ? <Text style={[type.caption, { color: colors.dangerText }]}>{error}</Text> : null}
      <Button label="Verify & update number" onPress={() => confirm()} disabled={otp.length !== OTP_LENGTH} loading={busy} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Pressable onPress={() => { setStep("number"); setError(""); }} hitSlop={8}>
          <Text style={[type.bodyMedium, { color: colors.primary }]}>Change number</Text>
        </Pressable>
        <Pressable onPress={send} disabled={seconds > 0 || busy} hitSlop={8}>
          <Text style={[type.bodyMedium, { color: seconds > 0 ? colors.textTertiary : colors.primary }]}>
            {seconds > 0 ? `Resend in ${formatCountdown(seconds)}` : "Resend OTP"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
