import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Linking, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "@/utils/nav";
import { useTheme } from "@/theme";
import { ORDER_STATUS_META } from "@/theme/colors";
import { ScreenContainer, Avatar, Banner, BottomBar, Button, Icon, IconButton, IconTile, ScreenHeader, SelectChip, StatusPill, VegMark } from "@/components/ui";
import { ordersApi, ApiError } from "@/api";
import { useAuthStore, useOrdersStore } from "@/store";
import { MerchantOrder } from "@/types";
import { PREP_OPTIONS, minutesLeft, paymentLabel, rupees, timeOf } from "@/utils/format";

const DELIVERY_LABEL: Record<string, string> = {
  searching_driver: "Finding a delivery partner",
  assigned: "Rider assigned",
  driver_arriving: "Rider on the way to your store",
  picked_up: "Picked up",
  in_transit: "On the way to customer",
  reached_destination: "At customer's location",
  delivered: "Delivered",
  cancelled: "Delivery cancelled",
};

export default function OrderDetail() {
  const { colors, type } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const merchant = useAuthStore((s) => s.merchant);
  const version = useOrdersStore((s) => s.version);
  const bump = useOrdersStore((s) => s.bump);

  const [order, setOrder] = useState<MerchantOrder | null>(null);
  const [prep, setPrep] = useState(merchant?.suggestedPrepMinutes ?? 15);
  const [busy, setBusy] = useState<"accept" | "reject" | "ready" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ordersApi.get(id);
      setOrder(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load this order");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, version]);

  // Rider progress isn't pushed to the store — refresh while it's in flight.
  useEffect(() => {
    if (!order || !["preparing", "ready", "picked_up"].includes(order.status)) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [order, load]);

  const run = async (kind: "accept" | "reject" | "ready", action: () => Promise<{ data: MerchantOrder }>) => {
    setBusy(kind);
    setError("");
    try {
      const res = await action();
      setOrder(res.data);
      bump();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      load();
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = () => {
    if (!order) return;
    Alert.alert(`Reject order #${order.orderNumber}?`, "The customer will be told the store couldn't take it.", [
      { text: "Keep", style: "cancel" },
      { text: "Item unavailable", onPress: () => run("reject", () => ordersApi.reject(order._id, "An item is unavailable")) },
      { text: "Too busy", onPress: () => run("reject", () => ordersApi.reject(order._id, "The store is too busy right now")) },
    ]);
  };

  if (!order) {
    return (
      <ScreenContainer bg={colors.surface}>
        <ScreenHeader title="Order" onBack={() => goBack()} style={{ paddingHorizontal: 0 }} />
        {error ? <Banner tone="danger" title={error} /> : <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
      </ScreenContainer>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const prepChoices = Array.from(new Set([...PREP_OPTIONS, merchant?.suggestedPrepMinutes ?? 15])).sort((a, b) => a - b);
  const left = minutesLeft(order.acceptedAt, order.prepMinutes);
  const driver = order.delivery?.driver;
  const address = [order.deliveryAddress.houseBuilding, order.deliveryAddress.addressLine, order.deliveryAddress.area, order.deliveryAddress.city]
    .filter(Boolean)
    .join(", ");

  return (
    <ScreenContainer edges={["top"]} padded={false} bg={colors.surface}>
      <ScreenHeader onBack={() => goBack()} right={<StatusPill label={meta?.label ?? order.status} tone={meta?.tone ?? "neutral"} />} />
      <View style={{ paddingHorizontal: 20, marginTop: -8, marginBottom: 10 }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Order #{order.orderNumber}</Text>
        <Text style={[type.meta, { color: colors.textTertiary }]}>
          Placed {timeOf(order.createdAt)} · {paymentLabel(order)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 16 }}>
        {/* Items */}
        <View style={[styles.card, { borderColor: colors.borderSoft }]}>
          {order.items.map((it, i) => (
            <View key={`${it.menuItemId}-${i}`} style={[styles.item, { borderBottomColor: colors.borderSoft }]}>
              <View style={[styles.qty, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[type.metaStrong, { color: colors.textPrimary }]}>{it.quantity}×</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <VegMark veg={it.isVeg} />
                  <Text style={[type.itemTitleSm, { color: colors.textPrimary, flexShrink: 1 }]}>{it.name}</Text>
                </View>
                {it.note ? <Text style={[type.meta, { color: colors.textTertiary }]}>{it.note}</Text> : null}
              </View>
              <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>{rupees(it.price * it.quantity)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[type.sectionLg, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[type.sectionLg, { color: colors.textPrimary }]}>{rupees(order.subtotal)}</Text>
          </View>
          {order.paymentMethod === "cod" ? (
            <Text style={[type.meta, { color: colors.warningText, paddingBottom: 12 }]}>
              Cash on delivery — the rider collects {rupees(order.subtotal)} for the food.
            </Text>
          ) : null}
        </View>

        {order.note ? (
          <View style={[styles.note, { backgroundColor: colors.warningTint }]}>
            <Icon name="sticky-note-2" size={20} color={colors.warningText} />
            <Text style={[type.caption, { color: colors.warningText, flex: 1 }]}>{order.note}</Text>
          </View>
        ) : null}

        {/* Customer */}
        <View style={[styles.card, styles.row, { borderColor: colors.borderSoft, paddingVertical: 14 }]}>
          <IconTile icon="location-on" bg={colors.surfaceAlt} fg={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>{order.customerName}</Text>
            <Text style={[type.meta, { color: colors.textSecondary }]} numberOfLines={2}>
              {address || "—"} · {order.distanceKm} km
            </Text>
          </View>
          <IconButton icon="call" onPress={() => Linking.openURL(`tel:${order.customerMobile}`)} />
        </View>

        {/* Prep time */}
        {order.status === "new" ? (
          <View style={{ gap: 10 }}>
            <Text style={[type.section, { color: colors.textPrimary }]}>Prep time</Text>
            <View style={styles.prepRow}>
              {prepChoices.map((m) => (
                <SelectChip key={m} label={`${m}m`} selected={prep === m} onPress={() => setPrep(m)} style={styles.prepChip} />
              ))}
            </View>
            {merchant?.settings.busyMode ? (
              <Text style={[type.meta, { color: colors.textTertiary }]}>Busy mode is on — suggested time includes +{merchant.busyExtraMinutes} min.</Text>
            ) : null}
          </View>
        ) : order.status === "preparing" ? (
          <View style={[styles.timerCard, { backgroundColor: left !== null && left < 0 ? colors.dangerTint : colors.primaryTint }]}>
            <Icon name="timer" size={22} color={left !== null && left < 0 ? colors.dangerText : colors.primaryText} />
            <Text style={[type.itemTitle, { color: left !== null && left < 0 ? colors.dangerText : colors.primaryText }]}>
              {left === null ? "Preparing" : left < 0 ? `${-left} min past the ${order.prepMinutes} min prep time` : `${left} min left of ${order.prepMinutes} min`}
            </Text>
          </View>
        ) : null}

        {/* Rider */}
        {order.status !== "rejected" && order.status !== "cancelled" ? (
          <View style={[styles.card, { borderColor: colors.borderSoft, paddingVertical: 14, gap: 12 }]}>
            <View style={styles.row}>
              {driver ? <Avatar name={driver.name} size={44} /> : <IconTile icon="two-wheeler" bg={colors.surfaceAlt} fg={colors.textSecondary} size={44} />}
              <View style={{ flex: 1 }}>
                <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>
                  {order.status === "new" ? "Rider assigned on accept" : driver ? driver.name : "Finding a delivery partner…"}
                </Text>
                <Text style={[type.meta, { color: colors.textSecondary }]}>
                  {order.status === "new"
                    ? "Nearby partners get the pickup as soon as you accept"
                    : driver
                      ? `${driver.vehicleNumber} · ${DELIVERY_LABEL[order.delivery?.status ?? ""] ?? ""}`
                      : DELIVERY_LABEL[order.delivery?.status ?? ""] ?? ""}
                </Text>
              </View>
              {driver?.mobile ? <IconButton icon="call" tone="primary" onPress={() => Linking.openURL(`tel:${driver.mobile}`)} /> : null}
            </View>
            {order.delivery?.pickupOtp ? (
              <View style={[styles.pin, { borderColor: colors.primaryDisabled, backgroundColor: colors.primarySoft }]}>
                <Text style={[type.caption, { color: colors.textSecondary, flex: 1 }]}>Rider shares this PIN at pickup — match it before handing over</Text>
                <Text style={[styles.pinText, { fontFamily: type.screenTitle.fontFamily, color: colors.primary }]}>{order.delivery.pickupOtp}</Text>
              </View>
            ) : null}
          </View>
        ) : order.rejectReason ? (
          <Banner tone="danger" title="Rejected" description={order.rejectReason} />
        ) : null}

        {error ? <Banner tone="danger" title="Something went wrong" description={error} /> : null}
      </ScrollView>

      {order.status === "new" ? (
        <BottomBar>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button label="Reject" variant="ghost" onPress={confirmReject} loading={busy === "reject"} disabled={!!busy} />
            </View>
            <View style={{ flex: 2 }}>
              <Button label={`Accept · ${prep} min`} onPress={() => run("accept", () => ordersApi.accept(order._id, prep))} loading={busy === "accept"} disabled={!!busy} />
            </View>
          </View>
        </BottomBar>
      ) : order.status === "preparing" ? (
        <BottomBar>
          <Button label="Mark ready for pickup" onPress={() => run("ready", () => ordersApi.ready(order._id))} loading={busy === "ready"} />
        </BottomBar>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  qty: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  note: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16 },
  prepRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prepChip: { flexGrow: 1, justifyContent: "center", minWidth: 64 },
  timerCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16 },
  pin: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderStyle: "dashed", borderRadius: 14 },
  pinText: { fontSize: 22, letterSpacing: 4 },
});
