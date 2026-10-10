import { Linking, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

/*
|--------------------------------------------------------------------------
| Loud new-order alerts for the store (Zomato / Swiggy style).
|
| New orders ring through a high-priority notification channel whose sound
| plays on Android's ALARM stream — loud even when the phone's notification,
| ringtone or media volume is low or it's on silent. The backend pushes on
| this channel (app in background, closed, or phone locked) and re-sends
| every 30 s until the order is accepted or rejected. The only volume the
| app ever changes is the alarm volume, and only when the store taps
| "Make it loud" on the setup screen.
*/

export const ORDER_CHANNEL_ID = "store_orders_v1"; // must match the backend (storeAlerts.service.js); bump to change settings
const ORDER_SOUND = "order_alert.wav"; // bundled via the expo-notifications plugin (app.json)
const ALERT_ID = "order-alert";
export const LOUD_ENOUGH = 0.6;

const isAndroid = Platform.OS === "android";

/*
 * expo-notifications is a native module: it's missing from Expo Go and from
 * APKs built before it was added, and importing it there crashes the app at
 * startup. So it's loaded lazily, and every function below degrades to
 * "not supported" (callers then use the in-app ringtone instead).
 */
type NotificationsModule = typeof import("expo-notifications");
let notificationsModule: NotificationsModule | null | undefined;
const N = (): NotificationsModule | null => {
  if (notificationsModule !== undefined) return notificationsModule;
  notificationsModule = null;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module (see above)
    const mod = require("expo-notifications") as NotificationsModule;
    // Show the alert banner + sound even while the app is open.
    mod.setNotificationHandler({
      handleNotification: async (n) => {
        // A new-order PUSH while the app is open: the app's own ringing
        // takes over — don't double-ring with the banner.
        const isNewOrderPush = (n.request.content.data as { type?: string } | undefined)?.type === "NEW_FOOD_ORDER";
        return {
          shouldShowBanner: !isNewOrderPush,
          shouldShowList: !isNewOrderPush,
          shouldPlaySound: !isNewOrderPush,
          shouldSetBadge: false,
          priority: mod.AndroidNotificationPriority.MAX,
        };
      },
    });
    notificationsModule = mod;
  } catch (err) {
    console.warn("[orderAlerts] expo-notifications unavailable — using in-app ringtone", err);
  }
  return notificationsModule;
};

/** Loud alerts need the native notifications module (a current APK build). */
export const alertsSupported = () => isAndroid && N() !== null;

// The volume module is native-only (not in Expo Go) — load it lazily.
type VolumeModule = typeof import("react-native-volume-manager");
let volumeModule: VolumeModule | null | undefined;
const volume = (): VolumeModule | null => {
  if (volumeModule !== undefined) return volumeModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module (absent in Expo Go)
    volumeModule = require("react-native-volume-manager") as VolumeModule;
  } catch {
    volumeModule = null;
  }
  return volumeModule;
};

let channelReady: Promise<void> | null = null;

export function ensureOrderChannel() {
  const Notifications = N();
  if (!isAndroid || !Notifications) return Promise.resolve();
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(ORDER_CHANNEL_ID, {
      name: "New order alerts",
      description: "Rings loudly for new food orders until you accept or reject them, using your alarm volume.",
      importance: Notifications.AndroidImportance.MAX,
      sound: ORDER_SOUND,
      enableVibrate: true,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    })
      .then(() => undefined)
      .catch((err) => {
        channelReady = null;
        throw err;
      });
  }
  return channelReady;
}

export interface AlertStatus {
  /** false in Expo Go / older builds without the notifications module. */
  supported: boolean;
  /** Notifications are allowed for the app. */
  allowed: boolean;
  /** System will show the permission dialog again (otherwise use settings). */
  canAsk: boolean;
  /** The store turned the order-alert channel down/off in system settings. */
  channelMuted: boolean;
  /** Alarm stream volume 0–1, or null when it can't be read (Expo Go / iOS). */
  alarmVolume: number | null;
  /** May ring through Do Not Disturb. null = unknown. */
  dndAccess: boolean | null;
}

export async function getAlertStatus(): Promise<AlertStatus> {
  const Notifications = N();
  if (!Notifications) {
    return { supported: false, allowed: false, canAsk: false, channelMuted: false, alarmVolume: null, dndAccess: null };
  }
  const perm = await Notifications.getPermissionsAsync();
  let channelMuted = false;
  if (isAndroid) {
    await ensureOrderChannel().catch(() => {});
    const ch = await Notifications.getNotificationChannelAsync(ORDER_CHANNEL_ID).catch(() => null);
    channelMuted = !!ch && (ch.importance < Notifications.AndroidImportance.HIGH || ch.sound == null);
  }
  let alarmVolume: number | null = null;
  let dndAccess: boolean | null = null;
  const vm = volume();
  if (isAndroid && vm) {
    try {
      const v = (await vm.VolumeManager.getVolume()) as unknown as Record<string, number>;
      alarmVolume = typeof v.alarm === "number" ? v.alarm : null;
    } catch {
      alarmVolume = null;
    }
    dndAccess = (await vm.VolumeManager.checkDndAccess().catch(() => undefined)) ?? null;
  }
  return { supported: true, allowed: perm.granted, canAsk: perm.canAskAgain, channelMuted, alarmVolume, dndAccess };
}

/** Anything that would make a new-order alert quiet or missing. */
export const needsAttention = (s: AlertStatus) =>
  s.supported &&
  (!s.allowed || s.channelMuted || (s.alarmVolume !== null && s.alarmVolume < LOUD_ENOUGH));

export async function requestNotificationPermission() {
  const Notifications = N();
  if (!Notifications) return false;
  await ensureOrderChannel().catch(() => {});
  const perm = await Notifications.getPermissionsAsync();
  if (perm.granted) return true;
  if (perm.canAskAgain) {
    const res = await Notifications.requestPermissionsAsync();
    if (res.granted) return true;
    if (res.canAskAgain) return false;
  }
  await openNotificationSettings();
  return false;
}

/** The app's notification settings (Android), falling back to its app-info page. */
export async function openNotificationSettings(channel = false) {
  const pkg = Constants.expoConfig?.android?.package;
  if (isAndroid && pkg) {
    try {
      if (channel) {
        await Linking.sendIntent("android.settings.CHANNEL_NOTIFICATION_SETTINGS", [
          { key: "android.provider.extra.APP_PACKAGE", value: pkg },
          { key: "android.provider.extra.CHANNEL_ID", value: ORDER_CHANNEL_ID },
        ]);
      } else {
        await Linking.sendIntent("android.settings.APP_NOTIFICATION_SETTINGS", [{ key: "android.provider.extra.APP_PACKAGE", value: pkg }]);
      }
      return;
    } catch {
      // fall through
    }
  }
  await Linking.openSettings();
}

export async function openSoundSettings() {
  try {
    await Linking.sendIntent("android.settings.SOUND_SETTINGS");
  } catch {
    await Linking.openSettings();
  }
}

/** Raises ONLY the alarm stream, and only when the store asks to. */
export async function raiseAlertVolume(level = 0.85) {
  const vm = volume();
  if (!isAndroid || !vm) {
    await openSoundSettings();
    return;
  }
  await vm.VolumeManager.setVolume(level, { type: "alarm", showUI: true, playSound: false });
}

export async function requestDndAccess() {
  const vm = volume();
  if (!isAndroid || !vm) return;
  await vm.VolumeManager.requestDndAccess().catch(() => {});
}

/**
 * Posts (or re-posts, to ring again) the loud order alert. Returns false when
 * notifications are off, so callers can fall back to in-app audio.
 */
export async function postOrderAlert(content: { title: string; body: string; data?: Record<string, unknown> }) {
  const Notifications = N();
  if (!isAndroid || !Notifications) return false;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return false;
  try {
    await ensureOrderChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: ALERT_ID,
      content: {
        title: content.title,
        body: content.body,
        data: { kind: "order_alert", ...(content.data ?? {}) },
        sound: ORDER_SOUND,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: "#FF5A20",
      },
      trigger: { channelId: ORDER_CHANNEL_ID },
    });
    return true;
  } catch {
    return false;
  }
}

export async function clearOrderAlert() {
  const Notifications = N();
  if (!isAndroid || !Notifications) return;
  await Notifications.dismissNotificationAsync(ALERT_ID).catch(() => {});
}

export type OrderAlertData = { kind?: string; type?: string; orderId?: string };

/**
 * Calls back when the store taps an order alert — including the tap that
 * launched the app from a closed state.
 */
export function onOrderAlertTapped(cb: (data: OrderAlertData) => void) {
  const Notifications = N();
  if (!Notifications) return () => {};
  const handled = new Set<string>();
  const handle = (response: { notification: { request: { identifier: string; content: { data?: unknown } } } } | null) => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handled.has(id)) return;
    handled.add(id);
    const data = response.notification.request.content.data as OrderAlertData;
    if (data?.kind === "order_alert") cb(data);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}

/** A new-order push arrived while the app is open (socket may have missed it). */
export function onNewOrderPush(cb: (orderId: string) => void) {
  const Notifications = N();
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationReceivedListener((n) => {
    const data = n.request.content.data as OrderAlertData;
    if (data?.type === "NEW_FOOD_ORDER" && data.orderId) cb(data.orderId);
  });
  return () => sub.remove();
}

/** Clears every shown new-order alert (all orders handled). */
export async function dismissAllOrderAlerts() {
  const Notifications = N();
  if (!Notifications) return;
  const shown = await Notifications.getPresentedNotificationsAsync().catch(() => []);
  await Promise.all(
    shown
      .filter((n) => (n.request.content.data as OrderAlertData)?.kind === "order_alert")
      .map((n) => Notifications.dismissNotificationAsync(n.request.identifier).catch(() => {}))
  );
}

/**
 * Expo push token for this device (null in Expo Go / without permission /
 * when Firebase isn't configured for the build).
 */
export async function getPushToken(): Promise<string | null> {
  const Notifications = N();
  if (!Notifications) return null;
  const perm = await Notifications.getPermissionsAsync().catch(() => null);
  if (!perm?.granted) return null;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  try {
    await ensureOrderChannel();
    const res = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return res.data;
  } catch (err) {
    console.warn("[orderAlerts] couldn't get a push token (is Firebase / google-services.json set up?)", err);
    return null;
  }
}

export function playTestAlert() {
  return postOrderAlert({ title: "Test alert", body: "This is how loud new orders will ring." });
}
