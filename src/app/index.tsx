import { useEffect } from "react";
import { View, Image, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { brand } from "@/theme";
import { storeApi } from "@/api";
import { useAuthStore } from "@/store";

// Launch gate: login → store setup → order queue.
export default function Launch() {
  const merchant = useAuthStore((s) => s.merchant);
  const setMerchant = useAuthStore((s) => s.setMerchant);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!merchant) {
        router.replace("/(auth)/login");
        return;
      }
      try {
        const res = await storeApi.getMe();
        if (!alive) return;
        setMerchant(res.data);
        router.replace(res.data.isSetupComplete ? "/(tabs)" : "/setup");
      } catch (err: any) {
        if (!alive) return;
        if (err?.status === 401 || err?.status === 403) {
          await signOut();
          router.replace("/(auth)/login");
        } else {
          // Offline: carry on with the cached profile.
          router.replace(merchant.isSetupComplete ? "/(tabs)" : "/setup");
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same lockup as the native splash, so the hand-off is seamless.
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Image source={require("../../assets/images/store-splash-lockup.png")} style={styles.lockup} resizeMode="contain" />
        <ActivityIndicator color={brand.orange} style={{ marginTop: 36 }} />
      </View>
      <Text style={styles.tagline}>Orders in. Pickups out.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", paddingBottom: 56 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  lockup: { width: 220, height: (220 * 713) / 879 },
  tagline: { color: brand.ink, fontSize: 16, fontWeight: "500" },
});
