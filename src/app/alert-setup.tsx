import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, AppState, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { goBack } from "@/utils/nav";
import { useTheme } from "@/theme";
import { ScreenContainer, Button, BottomBar, Icon, IconTile, ScreenHeader, IconName } from "@/components/ui";
import {
  AlertStatus,
  LOUD_ENOUGH,
  getAlertStatus,
  needsAttention,
  openNotificationSettings,
  openSoundSettings,
  playTestAlert,
  raiseAlertVolume,
  requestDndAccess,
  requestNotificationPermission,
} from "@/services/orderAlerts";

function Step({
  icon,
  title,
  detail,
  ok,
  optional,
  action,
  children,
}: {
  icon: IconName;
  title: string;
  detail: string;
  ok: boolean;
  optional?: boolean;
  action?: { label: string; onPress: () => void };
  children?: React.ReactNode;
}) {
  const { colors, type } = useTheme();
  return (
    <View style={[styles.step, { backgroundColor: colors.surface, borderColor: ok ? colors.borderSoft : optional ? colors.border : colors.primaryBorder }]}>
      <View style={styles.row}>
        <IconTile icon={icon} bg={ok ? colors.successTint : colors.primaryTint} fg={ok ? colors.success : colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[type.itemTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[type.meta, { color: colors.textSecondary }]}>{detail}</Text>
        </View>
        {ok ? <Icon name="check-circle" size={24} color={colors.success} /> : null}
      </View>
      {children}
      {!ok && action ? <Button label={action.label} size="md" variant={optional ? "ghost" : "primary"} onPress={action.onPress} /> : null}
    </View>
  );
}

// Guides the store to make new-order alerts loud (Zomato / Swiggy style). Uses the
// ALARM volume only — ringtone, media and notification volumes stay untouched.
export default function AlertSetup() {
  const { colors, type } = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [status, setStatus] = useState<AlertStatus | null>(null);
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(() => {
    getAlertStatus().then(setStatus).catch(() => {});
  }, []);

  useFocusEffect(refresh);

  // Coming back from system settings → re-check.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && refresh());
    return () => sub.remove();
  }, [refresh]);

  const after = (fn: () => Promise<unknown>) => async () => {
    await fn().catch(() => {});
    setTimeout(refresh, 400);
  };

  const test = async () => {
    setTesting(true);
    await playTestAlert();
    setTimeout(() => setTesting(false), 1500);
  };

  const done = () => goBack("/(tabs)");

  const vol = status?.alarmVolume ?? null;
  const pct = vol === null ? null : Math.round(vol * 100);
  const allGood = !!status && !needsAttention(status);

  return (
    <ScreenContainer edges={["top"]} padded={false} bg={colors.background}>
      <ScreenHeader title="Loud order alerts" onBack={done} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
        <View style={[styles.hero, { backgroundColor: allGood ? colors.successTint : colors.ink }]}>
          <Icon name={allGood ? "notifications-active" : "volume-up"} size={30} color={allGood ? colors.success : colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.section, { color: allGood ? colors.textPrimary : colors.onInk }]}>
              {allGood ? "You won't miss an order" : from === "open" ? "Before you start taking orders…" : "Never miss a new order"}
            </Text>
            <Text style={[type.meta, { color: allGood ? colors.textSecondary : colors.onInk, opacity: allGood ? 1 : 0.8 }]}>
              New orders ring loudly on your alarm volume until you accept or reject them — even when the app is closed or the phone
              is locked. Your ringtone, media and notification volumes are never changed.
            </Text>
          </View>
        </View>

        {status && !status.supported ? (
          <View style={[styles.step, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <IconTile icon="system-update" bg={colors.surfaceAlt} fg={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[type.itemTitle, { color: colors.textPrimary }]}>Needs the latest app version</Text>
                <Text style={[type.meta, { color: colors.textSecondary }]}>
                  Loud alerts work in the installed GoRush Store app, not in Expo Go or older builds. New orders still ring with the
                  in-app sound while the app is open.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {status?.supported ? (
          <>
            <Step
              icon="notifications"
              title="Allow notifications"
              detail={status.allowed ? "Order alerts can ring and show on your lock screen" : "Needed to ring for new orders"}
              ok={status.allowed}
              action={{ label: status.canAsk ? "Allow notifications" : "Open notification settings", onPress: after(requestNotificationPermission) }}
            />

            {Platform.OS === "android" && status.allowed ? (
              <Step
                icon="music-note"
                title="Order alert sound"
                detail={status.channelMuted ? "“New order alerts” is set to silent in settings" : "“New order alerts” rings with sound"}
                ok={!status.channelMuted}
                action={{ label: "Turn sound on", onPress: after(() => openNotificationSettings(true)) }}
              />
            ) : null}

            {Platform.OS === "android" ? (
              <Step
                icon="volume-up"
                title="Alert volume"
                detail={
                  pct === null
                    ? "Order alerts use your alarm volume — keep it high"
                    : vol! >= LOUD_ENOUGH
                      ? `Loud enough (${pct}%) · uses your alarm volume`
                      : `Only ${pct}% — orders may be easy to miss`
                }
                ok={pct === null ? false : vol! >= LOUD_ENOUGH}
                action={
                  pct === null
                    ? { label: "Open sound settings", onPress: after(openSoundSettings) }
                    : { label: "Make it loud", onPress: after(() => raiseAlertVolume()) }
                }
              >
                {pct !== null ? (
                  <View style={[styles.meter, { backgroundColor: colors.surfaceAlt }]}>
                    <View
                      style={[
                        styles.meterFill,
                        { width: `${Math.max(4, pct)}%`, backgroundColor: vol! >= LOUD_ENOUGH ? colors.success : colors.primary },
                      ]}
                    />
                  </View>
                ) : null}
                {pct !== null && vol! < LOUD_ENOUGH ? (
                  <Text style={[type.meta, { color: colors.textTertiary }]}>
                    “Make it loud” raises only the alarm volume to 85%. Ringtone, media and notification volume stay as they are.
                  </Text>
                ) : null}
              </Step>
            ) : null}

            {Platform.OS === "android" && status.dndAccess !== null ? (
              <Step
                icon="do-not-disturb-on"
                title="Ring in Do Not Disturb"
                detail={status.dndAccess ? "Order alerts ring even in Do Not Disturb" : "Optional — let order alerts ring during Do Not Disturb"}
                ok={status.dndAccess}
                optional
                action={{ label: "Allow in Do Not Disturb", onPress: after(requestDndAccess) }}
              />
            ) : null}
          </>
        ) : null}

        <Text style={[type.meta, { color: colors.textTertiary, textAlign: "center", marginTop: 4 }]}>
          {"Turn off battery optimisation for GoRush Store (Settings → Apps → GoRush Store → Battery) so alerts ring reliably on a locked phone."}
        </Text>
      </ScrollView>

      <BottomBar>
        <Button
          label={testing ? "Ringing…" : "Play test alert"}
          variant="secondary"
          icon={<Icon name="campaign" size={20} color={colors.primaryText} />}
          onPress={test}
          disabled={testing || !status?.allowed}
        />
        <Button label={allGood ? "Done" : "Continue"} onPress={done} />
      </BottomBar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", gap: 14, padding: 18, borderRadius: 22 },
  step: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  meter: { height: 8, borderRadius: 4, overflow: "hidden" },
  meterFill: { height: "100%", borderRadius: 4 },
});
