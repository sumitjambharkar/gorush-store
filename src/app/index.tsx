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

  return (
    <View style={[styles.container, { backgroundColor: brand.orange }]}>
      <Image source={require("../../assets/images/logo-tile.png")} style={styles.tile} />
      <Image source={require("../../assets/images/wordmark-splash.png")} style={styles.wordmark} resizeMode="contain" />
      <Text style={styles.tag}>STORE</Text>
      <ActivityIndicator color="#FFFFFF" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  tile: { width: 132, height: 132 },
  wordmark: { width: 220, height: (220 * 126) / 906, marginTop: 28 },
  tag: { color: brand.ink, fontSize: 14, fontWeight: "700", letterSpacing: 6, marginTop: 18 },
});
