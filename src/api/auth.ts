import { apiRequest, setToken, clearToken } from "./client";
import { Merchant } from "@/types";

export function sendOtp(mobile: string) {
  return apiRequest<{ success: true; data: { mobile: string; isNewMerchant: boolean; devOtp?: string } }>(
    "/api/merchant/auth/send-otp",
    { method: "POST", body: { mobile }, auth: false }
  );
}

export async function verifyOtp(mobile: string, otp: string) {
  const res = await apiRequest<{ success: true; data: { token: string; merchant: Merchant } }>("/api/merchant/auth/verify-otp", {
    method: "POST",
    body: { mobile, otp },
    auth: false,
  });
  await setToken(res.data.token);
  return res.data.merchant;
}

export async function logout() {
  await clearToken();
}
