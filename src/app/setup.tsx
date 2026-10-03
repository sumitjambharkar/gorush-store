import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { goBack } from "@/utils/nav";
import * as Location from "expo-location";
import { useTheme } from "@/theme";
import {
  ScreenContainer,
  Button,
  TextField,
  Banner,
  Icon,
  ScreenHeader,
  SegmentedControl,
  KeyboardScroll,
  KeyboardFooter,
  FOOTER_OFFSET,
} from "@/components/ui";
import { storeApi, ApiError } from "@/api";
import { useAuthStore } from "@/store";

const PRICE_LEVELS = [
  { value: "1", label: "₹" },
  { value: "2", label: "₹₹" },
  { value: "3", label: "₹₹₹" },
  { value: "4", label: "₹₹₹₹" },
];

const isTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// First-time store setup, and "Edit store" from the Store tab (?mode=edit).
export default function StoreSetup() {
  const { colors, type, spacing } = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editing = mode === "edit";
  const merchant = useAuthStore((s) => s.merchant);
  const setMerchant = useAuthStore((s) => s.setMerchant);
  const signOut = useAuthStore((s) => s.signOut);

  const [ownerName, setOwnerName] = useState(merchant?.ownerName ?? "");
  const [storeName, setStoreName] = useState(merchant?.storeName ?? "");
  const [cuisine, setCuisine] = useState(merchant?.cuisine ?? "");
  const [priceLevel, setPriceLevel] = useState(String(merchant?.priceLevel ?? 2));
  const [addressLine, setAddressLine] = useState(merchant?.address.addressLine ?? "");
  const [area, setArea] = useState(merchant?.address.area ?? "");
  const [city, setCity] = useState(merchant?.address.city ?? "");
  const [pincode, setPincode] = useState(merchant?.address.pincode ?? "");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    merchant?.address.latitude != null && merchant?.address.longitude != null
      ? { latitude: merchant.address.latitude, longitude: merchant.address.longitude }
      : null
  );
  const [open, setOpen] = useState(merchant?.openingHours.open ?? "11:00");
  const [close, setClose] = useState(merchant?.openingHours.close ?? "23:00");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pinStore = async () => {
    setLocating(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location access is needed to pin your store for delivery partners.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      const [place] = await Location.reverseGeocodeAsync(c).catch(() => [] as Location.LocationGeocodedAddress[]);
      if (place) {
        if (!area) setArea(place.district || place.subregion || place.street || "");
        if (!city) setCity(place.city || place.region || "");
        if (!pincode && place.postalCode) setPincode(place.postalCode);
        if (!addressLine && (place.name || place.street)) setAddressLine([place.name, place.street].filter(Boolean).join(", "));
      }
    } catch {
      setError("Couldn't get your location — try again near a window or with GPS on.");
    } finally {
      setLocating(false);
    }
  };

  const missing = !storeName.trim()
    ? "Enter your store name"
    : !addressLine.trim() || !city.trim()
      ? "Add the store address"
      : !coords
        ? "Pin the store location"
        : !isTime(open) || !isTime(close)
          ? "Opening hours must be like 11:00 and 23:00"
          : "";

  const handleSave = async () => {
    if (missing || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await storeApi.updateMe({
        ownerName: ownerName.trim(),
        storeName: storeName.trim(),
        cuisine: cuisine.trim(),
        priceLevel: Number(priceLevel),
        address: { addressLine: addressLine.trim(), area: area.trim(), city: city.trim(), pincode: pincode.trim(), ...coords! },
        openingHours: { open, close },
      });
      setMerchant(res.data);
      if (editing) goBack();
      else router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your store");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom"]} padded={false} bg={colors.surface}>
      <ScreenHeader
        title={editing ? "Edit store" : "Set up your store"}
        onBack={
          editing
            ? () => goBack()
            : async () => {
                await signOut();
                router.replace("/(auth)/login");
              }
        }
      />

      <KeyboardScroll bottomOffset={FOOTER_OFFSET} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: spacing.lg }}>
        {!editing ? (
          <Text style={[type.caption, { fontSize: 14, color: colors.textSecondary }]}>
            Customers see these details, and delivery partners use the pinned location to pick up orders.
          </Text>
        ) : null}

        <TextField label="Store name" value={storeName} onChangeText={setStoreName} placeholder="e.g. Masala House Kitchen" />
        <TextField label="Owner name" value={ownerName} onChangeText={setOwnerName} placeholder="Your full name" />
        <TextField label="Cuisine" value={cuisine} onChangeText={setCuisine} placeholder="e.g. North Indian · Biryani" />

        <View style={{ gap: 8 }}>
          <Text style={[type.captionMedium, { color: colors.textSecondary }]}>Price level</Text>
          <SegmentedControl options={PRICE_LEVELS} value={priceLevel} onChange={setPriceLevel} />
        </View>

        <Text style={[type.section, { color: colors.textPrimary, marginTop: 4 }]}>Address</Text>
        <TextField label="Shop no., building, street" value={addressLine} onChangeText={setAddressLine} placeholder="e.g. 100 Ft Rd" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextField label="Area" value={area} onChangeText={setArea} placeholder="Indiranagar" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="City" value={city} onChangeText={setCity} placeholder="Bengaluru" />
          </View>
        </View>
        <TextField label="Pincode" value={pincode} onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={6} />

        <View style={[styles.pin, { backgroundColor: coords ? colors.successTint : colors.surfaceAlt }]}>
          <Icon name={coords ? "check-circle" : "my-location"} size={22} color={coords ? colors.success : colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[type.itemTitleSm, { color: colors.textPrimary }]}>{coords ? "Store location pinned" : "Pin your store location"}</Text>
            <Text style={[type.meta, { color: colors.textSecondary }]}>
              {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "Stand at the store and use your current location"}
            </Text>
          </View>
        </View>
        <Button label={coords ? "Re-pin at my current location" : "Use my current location"} variant="secondary" onPress={pinStore} loading={locating} />

        <Text style={[type.section, { color: colors.textPrimary, marginTop: 4 }]}>Opening hours</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextField label="Opens (24h)" value={open} onChangeText={setOpen} placeholder="11:00" maxLength={5} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Closes (24h)" value={close} onChangeText={setClose} placeholder="23:00" maxLength={5} keyboardType="numbers-and-punctuation" />
          </View>
        </View>

        {error ? <Banner tone="danger" title="Something went wrong" description={error} /> : null}
      </KeyboardScroll>

      <KeyboardFooter style={[styles.footer, { borderTopColor: colors.borderSoft, backgroundColor: colors.surface }]}>
        {missing ? <Text style={[type.meta, { color: colors.textTertiary, textAlign: "center" }]}>{missing}</Text> : null}
        <Button label={editing ? "Save changes" : "Save & continue"} onPress={handleSave} disabled={!!missing} loading={saving} />
      </KeyboardFooter>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  pin: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, gap: 8 },
});
