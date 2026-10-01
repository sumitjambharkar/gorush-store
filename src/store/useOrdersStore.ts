import { create } from "zustand";
import { OrderCounts } from "@/types";

/*
 * Shared queue state. The tabs layout keeps `counts` fresh (socket + poll) so
 * the ringtone keeps going while an order waits; screens reload whenever
 * `version` changes.
 */
interface OrdersState {
  counts: OrderCounts;
  version: number;
  setCounts: (c: OrderCounts) => void;
  bump: () => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  counts: { new: 0, preparing: 0, ready: 0 },
  version: 0,
  setCounts: (counts) => set({ counts }),
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
