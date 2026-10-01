import { useCallback, useState } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { Banner, Icon, ListGroup, SkeletonCard } from "@/components/ui";
import { ordersApi, ApiError } from "@/api";
import { Insights } from "@/types";
import { rupees } from "@/utils/format";

export default function InsightsScreen() {
  const { colors, type, fontFamily } = useTheme();
  const [data, setData] = useState<Insights | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.insights();
      setData(res.data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load insights");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const max = Math.max(1, ...(data?.week.days.map((d) => d.sales) ?? [0]));
  const change = data?.week.changePct ?? null;
  const settleDate = data ? new Date(data.settlement.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 16 }}
        refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Insights</Text>
        {error ? <Banner tone="danger" title={error} /> : null}

        {!data ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Sales, last 7 days */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.meta, { color: colors.textTertiary }]}>Sales · last 7 days</Text>
                  <Text style={[styles.big, { fontFamily: fontFamily.extrabold, color: colors.textPrimary }]}>{rupees(data.week.total)}</Text>
                </View>
                {change !== null ? (
                  <View style={[styles.change, { backgroundColor: change >= 0 ? colors.successTint : colors.dangerTint }]}>
                    <Icon name={change >= 0 ? "arrow-drop-up" : "arrow-drop-down"} size={20} color={change >= 0 ? colors.successText : colors.dangerText} />
                    <Text style={[type.metaStrong, { color: change >= 0 ? colors.successText : colors.dangerText }]}>{Math.abs(change)}%</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.chart}>
                {data.week.days.map((d, i) => {
                  const last = i === data.week.days.length - 1;
                  return (
                    <View key={d.date} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            { height: `${Math.max(4, Math.round((d.sales / max) * 100))}%`, backgroundColor: last ? colors.primary : colors.primaryDisabled },
                          ]}
                        />
                      </View>
                      <Text style={[type.metaStrong, { fontSize: 11, color: colors.textTertiary }]}>{d.label.slice(0, 2)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Rating + acceptance */}
            <View style={styles.tiles}>
              <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
                <Text style={[type.meta, { color: colors.textTertiary }]}>Rating</Text>
                <Text style={[type.h2, { fontFamily: fontFamily.extrabold, color: colors.textPrimary }]}>
                  {data.rating.value ? `${data.rating.value.toFixed(1)} ★` : "—"}
                </Text>
                <Text style={[type.meta, { color: colors.textSecondary }]}>
                  {data.rating.count ? `${data.rating.count.toLocaleString("en-IN")} reviews` : "No reviews yet"}
                </Text>
              </View>
              <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
                <Text style={[type.meta, { color: colors.textTertiary }]}>Acceptance</Text>
                <Text style={[type.h2, { fontFamily: fontFamily.extrabold, color: colors.textPrimary }]}>
                  {data.acceptance.pct !== null ? `${data.acceptance.pct}%` : "—"}
                </Text>
                <Text style={[type.meta, { color: colors.textSecondary }]}>
                  {data.acceptance.declined ? `${data.acceptance.declined} declined this week` : "None declined this week"}
                </Text>
              </View>
            </View>

            {/* Settlement */}
            <View style={[styles.settle, { backgroundColor: colors.ink }]}>
              <Icon name="account-balance" size={26} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[type.metaStrong, { color: colors.onInk, opacity: 0.75 }]}>Next settlement · {settleDate}</Text>
                <Text style={[type.sectionLg, { fontSize: 20, color: colors.onInk }]}>{rupees(data.settlement.amount)}</Text>
              </View>
              <Text style={[type.meta, { color: colors.onInk, opacity: 0.6, maxWidth: 110, textAlign: "right" }]}>
                {data.settlement.orders} online order{data.settlement.orders === 1 ? "" : "s"} this week
              </Text>
            </View>

            {/* Top items */}
            <Text style={[type.section, { color: colors.textPrimary, marginTop: 4 }]}>Top items · 30 days</Text>
            {data.topItems.length ? (
              <ListGroup>
                {data.topItems.map((t, i) => (
                  <View key={t.name} style={[styles.row, { paddingVertical: 14, gap: 14 }]}>
                    <Text style={[type.metaStrong, { color: colors.textTertiary, width: 14 }]}>{i + 1}</Text>
                    <Text style={[type.itemTitleSm, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{t.name}</Text>
                    <Text style={[type.meta, { color: colors.textTertiary }]}>{t.sold} sold</Text>
                  </View>
                ))}
              </ListGroup>
            ) : (
              <Text style={[type.caption, { color: colors.textTertiary }]}>Your best sellers show up here once orders come in.</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  big: { fontSize: 32, lineHeight: 40, letterSpacing: -1 },
  change: { flexDirection: "row", alignItems: "center", paddingRight: 8, paddingLeft: 2, paddingVertical: 4, borderRadius: 10 },
  chart: { flexDirection: "row", height: 130, gap: 10, alignItems: "flex-end" },
  barCol: { flex: 1, height: "100%", alignItems: "center", gap: 6 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 8 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 14, gap: 2 },
  settle: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 22, padding: 18 },
});
