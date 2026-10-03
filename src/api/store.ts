import { apiRequest } from "./client";
import { Merchant, StoreAddress } from "@/types";

type R = { success: true; data: Merchant };

export interface StoreProfileInput {
  ownerName?: string;
  storeName?: string;
  cuisine?: string;
  priceLevel?: number;
  address?: Partial<StoreAddress>;
  openingHours?: { open?: string; close?: string };
}

export const getMe = () => apiRequest<R>("/api/merchant/me");

export const updateMe = (body: StoreProfileInput) => apiRequest<R>("/api/merchant/me", { method: "PATCH", body });

export const setOpen = (isOpen: boolean) => apiRequest<R>("/api/merchant/me/open", { method: "PATCH", body: { isOpen } });

export const updateSettings = (body: Partial<Merchant["settings"]>) =>
  apiRequest<R>("/api/merchant/me/settings", { method: "PATCH", body });

// Change the store's login mobile number — the OTP goes to the new number.
export const requestMobileOtp = (mobile: string) =>
  apiRequest<{ success: true; data: { mobile: string; devOtp?: string } }>("/api/merchant/me/mobile/request-otp", {
    method: "POST",
    body: { mobile },
  });

export const verifyMobileOtp = (mobile: string, otp: string) =>
  apiRequest<R>("/api/merchant/me/mobile/verify", { method: "POST", body: { mobile, otp } });
