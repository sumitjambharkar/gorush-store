import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
  KeyboardStickyView,
} from "react-native-keyboard-controller";

/*
 * Keyboard handling used by every screen with an input (Android edge-to-edge
 * doesn't resize the window for the keyboard, so plain ScrollView /
 * KeyboardAvoidingView leave inputs hidden on many phones).
 *
 * KeyboardScroll — scrolls the focused input above the keyboard. Pass the
 *   height of a KeyboardFooter below it as `bottomOffset` so the input also
 *   clears the footer button.
 * KeyboardFooter — a bottom action bar that rides on top of the keyboard.
 */

export function KeyboardScroll({ bottomOffset = 24, children, ...rest }: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

// Height of a footer holding one full-width Button, for KeyboardScroll's bottomOffset.
export const FOOTER_OFFSET = 96;

export function KeyboardFooter({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  // The keyboard's height already covers the navigation bar, so drop the
  // safe-area gap while it's open.
  return (
    <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }} style={[{ paddingVertical: 8 }, style]}>
      {children}
    </KeyboardStickyView>
  );
}
