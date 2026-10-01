import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { Banner, EmptyState, Icon, SkeletonCard, Switch, VegMark } from "@/components/ui";
import { menuApi, ApiError } from "@/api";
import { MenuItem } from "@/types";
import { rupees } from "@/utils/format";

export default function Menu() {
  const { colors, type, fontFamily, spacing } = useTheme();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await menuApi.list();
      setItems(res.data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your menu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => map.set(i.category, (map.get(i.category) ?? 0) + 1));
    return [...map.entries()];
  }, [items]);

  const visible = items.filter(
    (i) => (!category || i.category === category) && (!query.trim() || i.name.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const toggleStock = async (item: MenuItem, inStock: boolean) => {
    setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, inStock } : i)));
    try {
      await menuApi.update(item._id, { inStock });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, inStock: !inStock } : i)));
      Alert.alert("Couldn't update stock", err instanceof ApiError ? err.message : "Try again");
    }
  };

  const chip = (key: string | null, label: string) => {
    const on = category === key;
    return (
      <Pressable
        key={label}
        onPress={() => setCategory(key)}
        style={[styles.chip, { backgroundColor: on ? colors.ink : colors.surface, borderColor: on ? colors.ink : colors.borderSoft }]}
      >
        <Text style={[type.itemTitleSm, { fontSize: 13, color: on ? colors.onInk : colors.textSecondary }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[type.screenTitle, { color: colors.textPrimary, flex: 1 }]}>Menu</Text>
          <Pressable onPress={() => router.push("/menu/edit")} style={[styles.add, { backgroundColor: colors.primary }]}>
            <Icon name="add" size={20} color={colors.onPrimary} />
            <Text style={[type.itemTitleSm, { color: colors.onPrimary }]}>Add item</Text>
          </Pressable>
        </View>

        <View style={[styles.search, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="search" size={20} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${items.length} items`}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary, fontFamily: fontFamily.medium }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Icon name="close" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {categories.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {chip(null, `All · ${items.length}`)}
            {categories.map(([c, n]) => chip(c, `${c} · ${n}`))}
          </ScrollView>
        ) : null}
      </View>

      <FlatList
        style={{ backgroundColor: colors.background }}
        data={loading ? [] : visible}
        keyExtractor={(i) => i._id}
        contentContainerStyle={{ padding: 20, gap: 10, flexGrow: 1 }}
        refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={error ? <Banner tone="danger" title={error} /> : null}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.md }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : items.length === 0 ? (
            <EmptyState icon="restaurant-outline" title="Your menu is empty" description="Add the dishes you sell so customers can order them." actionLabel="Add first item" onAction={() => router.push("/menu/edit")} />
          ) : (
            <EmptyState icon="search-outline" title="No matching items" description="Try another name or category." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/menu/edit", params: { id: item._id } })}
            style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft, opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="restaurant" size={24} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <VegMark veg={item.isVeg} />
                <Text style={[type.itemTitleSm, { color: colors.textPrimary, flexShrink: 1 }]} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>{rupees(item.price)}</Text>
              <Text style={[type.metaStrong, { color: item.inStock ? colors.success : colors.dangerText }]}>
                {item.inStock ? "In stock" : "Out of stock"}
              </Text>
            </View>
            <Switch value={item.inStock} onChange={(v) => toggleStock(item, v)} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  add: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, height: 40, borderRadius: 12 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, borderRadius: 14, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, borderWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
