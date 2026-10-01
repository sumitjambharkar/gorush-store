import { apiRequest } from "./client";
import { Insights, MerchantOrder, OrderCounts, OrderStatus, TodaySummary } from "@/types";

type One = { success: true; data: MerchantOrder };

export const list = (statuses: OrderStatus[] = [], limit = 50) =>
  apiRequest<{ success: true; data: MerchantOrder[]; counts: OrderCounts; summary: TodaySummary }>(
    `/api/merchant/orders?status=${statuses.join(",")}&limit=${limit}`
  );

export const get = (id: string) => apiRequest<One>(`/api/merchant/orders/${id}`);

export const accept = (id: string, prepMinutes: number) =>
  apiRequest<One>(`/api/merchant/orders/${id}/accept`, { method: "POST", body: { prepMinutes } });

export const reject = (id: string, reason?: string) =>
  apiRequest<One>(`/api/merchant/orders/${id}/reject`, { method: "POST", body: { reason } });

export const ready = (id: string) => apiRequest<One>(`/api/merchant/orders/${id}/ready`, { method: "POST" });

export const insights = () => apiRequest<{ success: true; data: Insights }>("/api/merchant/insights");
