import { useEffect } from "react";
import { Vibration } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

const RINGTONE = require("../../assets/sounds/new-order-ring.wav");
const VIBRATION_PATTERN = [0, 400, 200, 400, 1000];

/**
 * Rings (looping sound + vibration) while `active` is true — used on the
 * incoming-request screen so a partner doesn't miss a new order.
 */
export function useRingtone(active: boolean) {
  const player = useAudioPlayer(RINGTONE);

  useEffect(() => {
    if (!active) return;

    player.loop = true;
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "duckOthers" })
      .catch(() => {})
      .finally(() => {
        player.seekTo(0);
        player.play();
      });
    Vibration.vibrate(VIBRATION_PATTERN, true);

    return () => {
      try {
        player.pause();
      } catch {
        // player already released on unmount
      }
      Vibration.cancel();
    };
  }, [active, player]);
}
