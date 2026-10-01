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
