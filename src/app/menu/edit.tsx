import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "@/utils/nav";
import { useTheme } from "@/theme";
import {
  ScreenContainer,
  Banner,
  Button,
  ListGroup,
  ScreenHeader,
  SegmentedControl,
  SelectChip,
  Switch,
  TextField,
  KeyboardScroll,
  KeyboardFooter,
  FOOTER_OFFSET,
} from "@/components/ui";
import { menuApi, ApiError } from "@/api";
import { MenuItem } from "@/types";

const DIET = [
  { value: "veg", label: "Veg" },
  { value: "nonveg", label: "Non-veg" },
];

// Add a new dish (no id) or edit / delete an existing one.
export default function EditMenuItem() {
  const { colors, type, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;

  const [all, setAll] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [diet, setDiet] = useState<"veg" | "nonveg">("veg");
  const [description, setDescription] = useState("");
  const [inStock, setInStock] = useState(true);
  const [loaded, setLoaded] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    menuApi
      .list()
      .then((res) => {
        setAll(res.data);
        const item = id ? res.data.find((i) => i._id === id) : null;
        if (item) {
          setName(item.name);
          setPrice(String(item.price));
          setCategory(item.category);
          setDiet(item.isVeg ? "veg" : "nonveg");
          setDescription(item.description);
          setInStock(item.inStock);
        } else if (id) {
          setError("This item no longer exists");
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [id]);

  const categories = useMemo(() => [...new Set(all.map((i) => i.category))].slice(0, 12), [all]);

  const missing = !name.trim() ? "Enter the item name" : !(Number(price) >= 0) || price === "" ? "Enter a price" : "";

  const handleSave = async () => {
    if (missing || saving) return;
    setSaving(true);
    setError("");
    const body = {
      name: name.trim(),
      price: Number(price),
      category: category.trim() || "Other",
      isVeg: diet === "veg",
      description: description.trim(),
      inStock,
    };
    try {
      if (editing) await menuApi.update(id!, body);
      else await menuApi.create(body);
      goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () =>
    Alert.alert("Delete this item?", `${name} will be removed from your menu.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await menuApi.remove(id!);
            goBack();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't delete the item");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);

  return (
    <ScreenContainer edges={["top", "bottom"]} padded={false} bg={colors.surface}>
      <ScreenHeader title={editing ? "Edit item" : "Add item"} onBack={() => goBack()} />

      {loaded ? (
        <KeyboardScroll bottomOffset={FOOTER_OFFSET} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: spacing.lg }}>
          <TextField label="Item name" value={name} onChangeText={setName} placeholder="e.g. Chicken Dum Biryani" />
          <TextField
            label="Price (₹)"
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
            placeholder="e.g. 320"
          />

          <View style={{ gap: 8 }}>
            <Text style={[type.captionMedium, { color: colors.textSecondary }]}>Veg / non-veg</Text>
            <SegmentedControl options={DIET} value={diet} onChange={(v) => setDiet(v as "veg" | "nonveg")} />
          </View>

          <View style={{ gap: 8 }}>
            <TextField label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Biryani" />
            {categories.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
                {categories.map((c) => (
                  <SelectChip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} style={{ paddingVertical: 7 }} />
                ))}
              </ScrollView>
            ) : null}
          </View>

          <TextField label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Half plate, serves one…" multiline />

          <ListGroup>
            <View style={styles.stockRow}>
              <View style={{ flex: 1 }}>
                <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>In stock</Text>
                <Text style={[type.meta, { color: colors.textTertiary }]}>{"Out-of-stock items can't be ordered"}</Text>
              </View>
              <Switch value={inStock} onChange={setInStock} />
            </View>
          </ListGroup>

          {error ? <Banner tone="danger" title="Something went wrong" description={error} /> : null}

          {editing ? <Button label="Delete item" variant="ghost" onPress={handleDelete} loading={deleting} /> : null}
        </KeyboardScroll>
      ) : null}

      <KeyboardFooter style={[styles.footer, { borderTopColor: colors.borderSoft, backgroundColor: colors.surface }]}>
        <Button label={editing ? "Save changes" : "Add to menu"} onPress={handleSave} disabled={!!missing || !loaded} loading={saving} />
      </KeyboardFooter>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stockRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1 },
});
