import { useEffect } from "react";
import { Vibration } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { clearOrderAlert, postOrderAlert } from "@/services/orderAlerts";

const RINGTONE = require("../../assets/sounds/new-order-ring.wav");
const VIBRATION_PATTERN = [0, 400, 200, 400, 1000];
// Each re-post of the alert rings again — keeps it going like a call.
const RING_EVERY_MS = 5000;

/**
 * Rings while `active` is true — while the store has new orders waiting
 * (app open or in the background). When the app is closed / the phone is
 * locked, the backend's push on the same loud channel does the ringing.
 *
 * Prefers the loud order-alert notification (plays on the ALARM stream, so it
 * stays loud when notification/media volume is low). Falls back to in-app
 * audio + vibration when notifications aren't allowed.
 */
export function useRingtone(active: boolean, alert?: { title: string; body: string; data?: Record<string, unknown> }) {
  const player = useAudioPlayer(RINGTONE);
  const title = alert?.title ?? "New order waiting";
  const body = alert?.body ?? "Open GoRush Store to accept it.";
  const orderId = alert?.data?.orderId;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let usingFallback = false;

    const ring = () => postOrderAlert({ title, body, data: orderId ? { orderId } : undefined });

    ring().then((posted) => {
      if (cancelled) return;
      if (posted) {
        timer = setInterval(ring, RING_EVERY_MS);
        return;
      }
      usingFallback = true;
      player.loop = true;
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "duckOthers" })
        .catch(() => {})
        .finally(() => {
          if (cancelled) return;
          player.seekTo(0);
          player.play();
        });
      Vibration.vibrate(VIBRATION_PATTERN, true);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      clearOrderAlert();
      if (usingFallback) {
        try {
          player.pause();
        } catch {
          // player already released on unmount
        }
        Vibration.cancel();
      }
    };
  }, [active, player, title, body, orderId]);
}
