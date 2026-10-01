import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { useTheme } from "@/theme";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export function OtpInput({ length = 4, value, onChange, autoFocus = true }: OtpInputProps) {
  const { colors, radii, type, spacing } = useTheme();
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    const joined = next.join("").slice(0, length);
    onChange(joined);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(r) => {
            inputs.current[index] = r;
          }}
          value={digit}
          onChangeText={(t) => setDigit(index, t.replace(/[^0-9]/g, "").slice(-1))}
          onKeyPress={(e) => handleKeyPress(index, e)}
          onFocus={() => setFocusedIndex(index)}
          keyboardType="number-pad"
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          style={[
            type.h2,
            styles.box,
            {
              borderRadius: radii.md,
              borderColor: focusedIndex === index ? colors.primary : colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              marginRight: index === length - 1 ? 0 : spacing.md,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  box: {
    width: 56,
    height: 64,
    borderWidth: 1.5,
    textAlign: "center",
  },
});
