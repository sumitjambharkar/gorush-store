import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { ORDER_STATUS_META } from "@/theme/colors";
import { Banner, Button, EmptyState, Icon, IconTile, SkeletonCard, StatusPill, Switch } from "@/components/ui";
import { ordersApi, storeApi, ApiError } from "@/api";
import { useAuthStore, useOrdersStore } from "@/store";
import { MerchantOrder, OrderStatus, TodaySummary } from "@/types";
import { itemCount, itemsLine, minutesLeft, paymentLabel, rupees, timeOf } from "@/utils/format";

type Tab = "new" | "preparing" | "ready" | "past";

const TAB_STATUSES: Record<Tab, OrderStatus[]> = {
  new: ["new"],
  preparing: ["preparing"],
  ready: ["ready"],
  past: ["picked_up", "delivered", "rejected", "cancelled"],
};

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "past", label: "Past" },
];

export default function OrderQueue() {
  const { colors, type, spacing, shadows } = useTheme();
  const merchant = useAuthStore((s) => s.merchant);
  const setMerchant = useAuthStore((s) => s.setMerchant);
  const counts = useOrdersStore((s) => s.counts);
  const setCounts = useOrdersStore((s) => s.setCounts);
  const version = useOrdersStore((s) => s.version);

  const [tab, setTab] = useState<Tab>("new");
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.list(TAB_STATUSES[tab]);
      setOrders(res.data);
      setCounts(res.counts);
      setSummary(res.summary);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, setCounts]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Socket/poll told us something changed.
  useEffect(() => {
    if (version) load();
  }, [version, load]);

  // Keep "ready in N min" countdowns moving.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    setLoading(true);
    setOrders([]);
    setTab(t);
  };

  const toggleOpen = async (next: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await storeApi.setOpen(next);
      setMerchant(res.data);
    } catch (err) {
      Alert.alert("Couldn't update", err instanceof ApiError ? err.message : "Try again");
    } finally {
      setToggling(false);
    }
  };

  const act = async (order: MerchantOrder, action: () => Promise<unknown>) => {
    setBusyId(order._id);
    try {
      await action();
      await load();
    } catch (err) {
      Alert.alert(`Order #${order.orderNumber}`, err instanceof ApiError ? err.message : "Something went wrong");
      load();
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = (order: MerchantOrder) =>
    Alert.alert(`Reject order #${order.orderNumber}?`, "The customer will be told the store couldn't take it.", [
      { text: "Keep", style: "cancel" },
      { text: "Item unavailable", onPress: () => act(order, () => ordersApi.reject(order._id, "An item is unavailable")) },
      { text: "Too busy", onPress: () => act(order, () => ordersApi.reject(order._id, "The store is too busy right now")) },
    ]);

  const prep = merchant?.suggestedPrepMinutes ?? 15;
  const isOpen = !!merchant?.isOpen;

  const stats = [
    { label: "Sales today", value: rupees(summary?.salesToday ?? 0) },
    { label: "Orders", value: String(summary?.ordersToday ?? 0) },
    { label: "Avg prep", value: summary?.avgPrepMinutes ? `${summary.avgPrepMinutes} min` : "—" },
  ];

  const renderOrder = ({ item: o }: { item: MerchantOrder }) => {
    const busy = busyId === o._id;
    const left = minutesLeft(o.acceptedAt, o.prepMinutes);
    const driver = o.delivery?.driver;
    const meta = ORDER_STATUS_META[o.status];
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/order/[id]", params: { id: o._id } })}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft, opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={[type.section, { color: colors.textPrimary }]} numberOfLines={1}>
              #{o.orderNumber} · {o.customerName}
            </Text>
            <Text style={[type.meta, { color: colors.textTertiary }]}>
              {timeOf(o.createdAt)} · {itemCount(o.items)} items · {paymentLabel(o)}
            </Text>
          </View>
          {tab === "past" ? <StatusPill label={meta?.label ?? o.status} tone={meta?.tone ?? "neutral"} /> : null}
          <Text style={[type.amount, { fontSize: 16, color: colors.textPrimary }]}>{rupees(o.subtotal)}</Text>
        </View>

        <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={2}>
          {itemsLine(o.items)}
        </Text>

        {o.note ? (
          <View style={[styles.note, { backgroundColor: colors.warningTint }]}>
            <Icon name="sticky-note-2" size={16} color={colors.warningText} />
            <Text style={[type.meta, { color: colors.warningText, flex: 1 }]} numberOfLines={2}>{o.note}</Text>
          </View>
        ) : null}

        {o.status === "new" ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label="Reject" variant="ghost" size="md" onPress={() => confirmReject(o)} disabled={busy} />
            </View>
            <View style={{ flex: 2 }}>
              <Button label={`Accept · ${prep} min`} size="md" loading={busy} onPress={() => act(o, () => ordersApi.accept(o._id, prep))} />
            </View>
          </View>
        ) : o.status === "preparing" || o.status === "ready" ? (
          <>
            <View style={[styles.rider, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="two-wheeler" size={20} color={driver ? colors.success : colors.textTertiary} />
              <Text style={[type.metaStrong, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
                {driver ? `${driver.name} · ${driver.vehicleNumber}` : "Finding a delivery partner…"}
              </Text>
              {o.delivery?.pickupOtp ? (
                <Text style={[type.metaStrong, { color: colors.primary }]}>PIN {o.delivery.pickupOtp}</Text>
              ) : null}
            </View>
            {o.status === "preparing" ? (
              <View style={styles.actions}>
                <View style={[styles.timer, { backgroundColor: left !== null && left < 0 ? colors.dangerTint : colors.primaryTint }]}>
                  <Icon name="timer" size={18} color={left !== null && left < 0 ? colors.dangerText : colors.primaryText} />
                  <Text style={[type.itemTitleSm, { color: left !== null && left < 0 ? colors.dangerText : colors.primaryText }]}>
                    {left === null ? "Preparing" : left < 0 ? `${-left} min late` : `${left} min left`}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Mark ready" size="md" loading={busy} onPress={() => act(o, () => ordersApi.ready(o._id))} />
                </View>
              </View>
            ) : (
              <Text style={[type.meta, { color: colors.successText }]}>Packed · hand over when the rider shares the PIN</Text>
            )}
          </>
        ) : o.status === "rejected" && o.rejectReason ? (
          <Text style={[type.meta, { color: colors.dangerText }]}>{o.rejectReason}</Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.storeRow}>
          <IconTile icon="restaurant" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[type.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{merchant?.storeName || "Your store"}</Text>
            <Text style={[type.meta, { color: colors.textTertiary }]} numberOfLines={1}>
              {merchant?.address.area || merchant?.address.city || "—"} · GoRush merchant
            </Text>
          </View>
          <View style={[styles.openPill, { backgroundColor: isOpen ? colors.successTint : colors.surfaceAlt }]}>
            <Text style={[type.overline, { color: isOpen ? colors.successText : colors.textTertiary }]}>{isOpen ? "OPEN" : "CLOSED"}</Text>
            <Switch value={isOpen} onChange={toggleOpen} disabled={toggling} small />
          </View>
        </View>

        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[type.meta, { color: colors.textTertiary }]}>{s.label}</Text>
              <Text style={[type.sectionLg, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.surfaceAlt }]}>
          {TABS.map((t) => {
            const on = t.key === tab;
            const n = t.key === "past" ? 0 : counts[t.key];
            return (
              <Pressable key={t.key} onPress={() => switchTab(t.key)} style={[styles.tab, on ? [{ backgroundColor: colors.surface }, shadows.subtle] : null]}>
                <Text style={[type.itemTitleSm, { fontSize: 13, color: on ? colors.textPrimary : colors.textTertiary }]}>{t.label}</Text>
                {n > 0 ? (
                  <View style={[styles.badge, { backgroundColor: t.key === "new" ? colors.primary : colors.textTertiary }]}>
                    <Text style={[type.metaStrong, { fontSize: 11, color: colors.onPrimary }]}>{n}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        style={{ backgroundColor: colors.background }}
        data={loading ? [] : orders}
        keyExtractor={(o) => o._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {!isOpen ? (
              <Banner tone="warning" title="Your store is closed" description="Switch it on to start receiving orders." />
            ) : null}
            {error ? <Banner tone="danger" title={error} /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.md }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <EmptyState
              icon={tab === "new" ? "notifications-outline" : "receipt-outline"}
              title={tab === "new" ? "No new orders" : tab === "past" ? "No past orders yet" : `Nothing ${tab === "ready" ? "ready" : "being prepared"}`}
              description={tab === "new" ? (isOpen ? "New orders ring here the moment they come in." : "Open your store to receive orders.") : "Orders move here as you work on them."}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  storeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  openPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 12, paddingRight: 6, paddingVertical: 5, borderRadius: 18 },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  tabs: { flexDirection: "row", borderRadius: 14, padding: 4 },
  tab: { flex: 1, height: 38, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 12 },
  actions: { flexDirection: "row", gap: 10, alignItems: "center" },
  rider: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  timer: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 48, borderRadius: 14 },
});
