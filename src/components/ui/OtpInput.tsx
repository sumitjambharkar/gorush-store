import React, { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import { useTheme } from "@/theme";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are in (typed, pasted or auto-filled from the SMS). */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  /**
   * Offer the code from the incoming SMS (iOS keyboard suggestion, Android
   * autofill). Turn off for codes that don't arrive by SMS (delivery PINs).
   */
  smsAutofill?: boolean;
}

/*
 * One real (invisible) TextInput behind the boxes. A single field is what the
 * OS needs to auto-fill / paste a whole code — separate one-digit inputs drop
 * all but the first digit.
 */
export function OtpInput({ length = 6, value, onChange, onComplete, autoFocus = true, smsAutofill = true }: OtpInputProps) {
  const { colors, radii, type } = useTheme();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const code = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(code);
    if (code.length === length && code !== value) onComplete?.(code);
  };

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => input.current?.focus()} style={styles.row} accessibilityLabel={`${length}-digit code`}>
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? "";
        const active = focused && i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                borderRadius: radii.md,
                borderColor: active ? colors.primary : digit ? colors.textSecondary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={[type.h2, { color: colors.textPrimary }]}>{digit}</Text>
          </View>
        );
      })}

      <TextInput
        ref={input}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        caretHidden
        contextMenuHidden={false}
        // SMS code auto-fill: iOS suggests it above the keyboard, Android
        // offers it via autofill / the keyboard's suggestion strip.
        textContentType={smsAutofill ? "oneTimeCode" : "none"}
        autoComplete={smsAutofill ? (Platform.OS === "android" ? "sms-otp" : "one-time-code") : "off"}
        importantForAutofill={smsAutofill ? "yes" : "no"}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8, alignSelf: "stretch" },
  box: {
    flex: 1,
    maxWidth: 56,
    height: 58,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Covers the boxes so taps / long-press paste land on it; nearly invisible
  // (fully transparent inputs can lose autofill on some Android versions).
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.015,
    color: "transparent",
    fontSize: 1,
  },
});
