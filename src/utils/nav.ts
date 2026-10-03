import { router, type Href } from "expo-router";

/**
 * Go back if there's a screen to go back to; otherwise open `fallback`.
 * A bare router.back() throws "GO_BACK was not handled" when the screen was
 * opened directly (after a reload, from a notification or a link).
 */
export function goBack(fallback: Href = "/(tabs)") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
