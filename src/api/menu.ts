import { apiRequest } from "./client";
import { MenuItem } from "@/types";

export type MenuItemInput = Pick<MenuItem, "name" | "price" | "category" | "isVeg"> & Partial<Pick<MenuItem, "description" | "inStock">>;

export const list = () => apiRequest<{ success: true; data: MenuItem[] }>("/api/merchant/menu");

export const create = (body: MenuItemInput) =>
  apiRequest<{ success: true; data: MenuItem }>("/api/merchant/menu", { method: "POST", body });

export const update = (id: string, body: Partial<MenuItemInput>) =>
  apiRequest<{ success: true; data: MenuItem }>(`/api/merchant/menu/${id}`, { method: "PATCH", body });

export const remove = (id: string) => apiRequest<{ success: true }>(`/api/merchant/menu/${id}`, { method: "DELETE" });
