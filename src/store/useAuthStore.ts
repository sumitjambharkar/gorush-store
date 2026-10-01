import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi, getToken } from "@/api";
import { Merchant } from "@/types";

const MERCHANT_KEY = "merchant_profile";

interface AuthState {
  merchant: Merchant | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setMerchant: (m: Merchant) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  merchant: null,
  hasHydrated: false,

  hydrate: async () => {
    const token = await getToken();
    const raw = await SecureStore.getItemAsync(MERCHANT_KEY);
    set({ merchant: token && raw ? JSON.parse(raw) : null, hasHydrated: true });
  },

  setMerchant: (merchant) => {
    SecureStore.setItemAsync(MERCHANT_KEY, JSON.stringify(merchant)).catch(() => {});
    set({ merchant });
  },

  signOut: async () => {
    await authApi.logout();
    await SecureStore.deleteItemAsync(MERCHANT_KEY);
    set({ merchant: null });
  },
}));
