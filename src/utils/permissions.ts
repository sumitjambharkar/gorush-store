import { Alert, Linking } from "react-native";

/*
 * Ask for a permission at the moment a feature needs it (never up front).
 *
 *   already allowed        → true
 *   can still ask          → system prompt
 *   refused just now       → explain why it's needed, false
 *   blocked ("don't ask")  → explain + "Open settings", false
 *
 * Pass the module's own get/request functions so this file doesn't pull in
 * native modules an app doesn't use.
 */

type PermissionResponse = { granted: boolean; canAskAgain?: boolean; status?: string };

export interface PermissionRequest {
  get: () => Promise<PermissionResponse>;
  request: () => Promise<PermissionResponse>;
  /** e.g. "Location access needed" */
  title: string;
  /** Why the feature needs it, in plain words. */
  reason: string;
}

export async function ensurePermission({ get, request, title, reason }: PermissionRequest): Promise<boolean> {
  try {
    const current = await get();
    if (current.granted) return true;

    if (current.canAskAgain !== false) {
      const asked = await request();
      if (asked.granted) return true;
      if (asked.canAskAgain !== false) {
        Alert.alert(title, reason);
        return false;
      }
    }

    // Blocked — only the Settings app can turn it back on.
    Alert.alert(title, `${reason}\n\nTurn it on in Settings → Permissions.`, [
      { text: "Not now", style: "cancel" },
      { text: "Open settings", onPress: () => Linking.openSettings().catch(() => {}) },
    ]);
    return false;
  } catch {
    return false;
  }
}
