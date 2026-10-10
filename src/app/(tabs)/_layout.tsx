import { useCallback, useEffect } from "react";
import { Vibration } from "react-native";
import { Tabs, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { getSocket, joinRoom, leaveRoom, ordersApi, storeApi } from "@/api";
import { useAuthStore, useOrdersStore } from "@/store";
import { useRingtone } from "@/hooks/useRingtone";
import { dismissAllOrderAlerts, ensureOrderChannel, getPushToken, onNewOrderPush, onOrderAlertTapped, requestNotificationPermission } from "@/services/orderAlerts";

const POLL_MS = 15000;

export default function TabsLayout() {
  const { colors, fontFamily } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const merchant = useAuthStore((s) => s.merchant);
  const newCount = useOrdersStore((s) => s.counts.new);
  const setCounts = useOrdersStore((s) => s.setCounts);
  const bump = useOrdersStore((s) => s.bump);

  const refreshCounts = useCallback(async () => {
    try {
      const res = await ordersApi.list(["new"], 1);
      setCounts(res.counts);
    } catch {
      // keep last counts
    }
  }, [setCounts]);

  // Live channel for this store, with polling as a fallback.
  useEffect(() => {
    if (!merchant?._id) return;
    const room = `merchant:${merchant._id}`;
    joinRoom(room);
    const socket = getSocket();
    const onReconnect = () => joinRoom(room);

    const onNew = () => {
      if (!useAuthStore.getState().merchant?.settings.loudAlerts) Vibration.vibrate(400);
      refreshCounts();
      bump();
    };
    const onUpdate = () => {
      refreshCounts();
      bump();
    };

    socket.on("connect", onReconnect);
    socket.on("order:new", onNew);
    socket.on("order:updated", onUpdate);
    refreshCounts();
    const poll = setInterval(refreshCounts, POLL_MS);

    return () => {
      leaveRoom(room);
      socket.off("connect", onReconnect);
      socket.off("order:new", onNew);
      socket.off("order:updated", onUpdate);
      clearInterval(poll);
    };
  }, [merchant?._id, refreshCounts, bump]);

  // Register this phone for pushes, so new orders ring even when the app is
  // closed or the phone is locked (the backend re-sends every 30 s until handled).
  useEffect(() => {
    if (!merchant?._id) return;
    ensureOrderChannel().catch(() => {});
    (async () => {
      await requestNotificationPermission().catch(() => false);
      const token = await getPushToken();
      if (token) storeApi.registerPushToken(token).catch(() => {});
    })();
  }, [merchant?._id]);

  // A push arrived while open (socket may have missed it) → refresh; tapping an
  // alert (also from a closed app) opens that order.
  useEffect(() => {
    const offPush = onNewOrderPush(() => {
      refreshCounts();
      bump();
    });
    const offTap = onOrderAlertTapped((data) => {
      if (data.orderId) router.push({ pathname: "/order/[id]", params: { id: data.orderId } });
    });
    return () => {
      offPush();
      offTap();
    };
  }, [refreshCounts, bump]);

  // All new orders handled → clear any alerts still in the notification tray.
  useEffect(() => {
    if (newCount === 0) dismissAllOrderAlerts().catch(() => {});
  }, [newCount]);

  // "Loud order alerts": ring until every new order has been handled (app open
  // or in the background; when closed/locked the backend's push rings).
  useRingtone(
    !!merchant?.settings.loudAlerts && newCount > 0,
    newCount > 0
      ? {
          title: newCount === 1 ? "New order waiting" : `${newCount} new orders waiting`,
          body: "Tap to open GoRush Store and accept.",
        }
      : undefined
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontFamily: fontFamily.bold, fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Orders",
          tabBarBadge: newCount > 0 ? newCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontFamily: fontFamily.bold, fontSize: 10 },
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{ title: "Menu", tabBarIcon: ({ color }) => <MaterialIcons name="menu-book" color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: "Insights", tabBarIcon: ({ color }) => <MaterialIcons name="insights" color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="store"
        options={{ title: "Store", tabBarIcon: ({ color }) => <MaterialIcons name="storefront" color={color} size={24} /> }}
      />
    </Tabs>
  );
}
